/**
 * lib/fileStorage.ts
 *
 * ── STORAGE ABSTRACTION LAYER ──────────────────────────────────────────────
 * Unified interface for file uploads and deletions across the application.
 *
 * Supported Drivers:
 * 1. "supabase" — Uploads files to Supabase Storage Bucket ('clearance-files').
 * 2. "local"    — Saves files to local disk under `public/uploads/` (dev fallback).
 *
 * ── EASY MIGRATION TO OTHER STORAGE (AWS S3 / Cloudinary / MinIO) ──────────
 * To switch to AWS S3, Cloudinary, MinIO, or a custom self-hosted server later:
 * 1. Add your new driver function below (e.g. `uploadToS3`).
 * 2. Update `uploadFile()` to call your new driver function.
 * All API routes and UI components calling `uploadFile()` will keep working without any changes.
 */

import fs from "fs/promises";
import path from "path";

const UPLOAD_ROOT = path.join(process.cwd(), "public", "uploads");

// Retrieve Supabase Storage Configuration from environment
const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL;
const SUPABASE_KEY = process.env.SUPABASE_ANON_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
const SUPABASE_BUCKET = process.env.STORAGE_BUCKET || "clearance-files";

/**
 * Uploads a file to Supabase Storage via REST API.
 */
async function uploadToSupabase(file: File, folder: string): Promise<string> {
  if (!SUPABASE_URL || !SUPABASE_KEY) {
    throw new Error("Supabase URL and Anon Key must be defined in .env to use Supabase Storage.");
  }

  const uniqueId = `${Date.now()}-${Math.floor(100 + Math.random() * 900)}`;
  const originalExt = path.extname(file.name);
  const sanitizedName = `${uniqueId}${originalExt}`;
  const storagePath = `${folder}/${sanitizedName}`;

  const arrayBuffer = await file.arrayBuffer();
  const fileBuffer = Buffer.from(arrayBuffer);

  const endpoint = `${SUPABASE_URL}/storage/v1/object/${SUPABASE_BUCKET}/${storagePath}`;

  const response = await fetch(endpoint, {
    method: "POST",
    headers: {
      "Authorization": `Bearer ${SUPABASE_KEY}`,
      "apiKey": SUPABASE_KEY,
      "Content-Type": file.type || "application/octet-stream",
      "x-upsert": "true",
    },
    body: fileBuffer,
  });

  if (!response.ok) {
    const errorText = await response.text();
    console.error("[Supabase Storage Upload Error]", errorText);
    throw new Error(`Supabase Storage upload failed: ${response.statusText}`);
  }

  // Return public URL of the uploaded object
  return `${SUPABASE_URL}/storage/v1/object/public/${SUPABASE_BUCKET}/${storagePath}`;
}

/**
 * Converts a File to a Base64 data URL fallback when filesystem storage is unavailable (e.g., read-only environments).
 */
async function fileToBase64DataUrl(file: File): Promise<string> {
  const arrayBuffer = await file.arrayBuffer();
  const base64 = Buffer.from(arrayBuffer).toString("base64");
  const mimeType = file.type || "image/png";
  return `data:${mimeType};base64,${base64}`;
}

/**
 * Saves an uploaded File object to the local filesystem under public/uploads/{folder}/
 */
async function uploadToLocal(file: File, folder: string): Promise<string> {
  try {
    const uniqueId = `${Date.now()}-${Math.floor(100 + Math.random() * 900)}`;
    const originalExt = path.extname(file.name);
    const sanitizedName = `${uniqueId}${originalExt}`;

    const targetDir = path.join(UPLOAD_ROOT, folder);
    const targetFilePath = path.join(targetDir, sanitizedName);

    await fs.mkdir(targetDir, { recursive: true });

    const arrayBuffer = await file.arrayBuffer();
    const buffer = Buffer.from(arrayBuffer);

    await fs.writeFile(targetFilePath, buffer);

    return `/uploads/${folder}/${sanitizedName}`;
  } catch (err) {
    console.warn("[fileStorage] Local disk upload failed (read-only filesystem). Falling back to Base64 data URL.", err);
    return await fileToBase64DataUrl(file);
  }
}

/**
 * Universal File Upload function called across the application.
 */
export async function uploadFile(file: File, folder: string): Promise<string> {
  // Use Supabase Storage if configured, otherwise fall back to local disk or base64
  const useSupabase = Boolean(SUPABASE_URL && SUPABASE_KEY);

  if (useSupabase) {
    try {
      return await uploadToSupabase(file, folder);
    } catch (err) {
      console.warn("[fileStorage] Supabase upload failed. Falling back to local storage / base64.", err);
      return await uploadToLocal(file, folder);
    }
  }

  return await uploadToLocal(file, folder);
}

/**
 * Deletes a file based on its URL (Supabase URL or local relative path).
 */
export async function deleteFile(url: string): Promise<void> {
  if (url.includes("/storage/v1/object/public/")) {
    if (!SUPABASE_URL || !SUPABASE_KEY) return;
    try {
      const parts = url.split(`/storage/v1/object/public/${SUPABASE_BUCKET}/`);
      if (parts.length < 2) return;
      const storagePath = parts[1];
      const endpoint = `${SUPABASE_URL}/storage/v1/object/${SUPABASE_BUCKET}/${storagePath}`;
      await fetch(endpoint, {
        method: "DELETE",
        headers: {
          "Authorization": `Bearer ${SUPABASE_KEY}`,
          "apiKey": SUPABASE_KEY,
        },
      });
    } catch (err) {
      console.error("[fileStorage] Failed to delete file from Supabase Storage", err);
    }
    return;
  }

  if (!url.startsWith("/uploads/")) return;

  const relativePath = url.substring("/uploads/".length);
  const targetFilePath = path.join(UPLOAD_ROOT, relativePath);

  try {
    await fs.unlink(targetFilePath);
  } catch (err: any) {
    if (err.code !== "ENOENT") {
      console.error(`[fileStorage] Failed to delete local file: ${targetFilePath}`, err);
    }
  }
}
