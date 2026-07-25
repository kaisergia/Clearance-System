/**
 * lib/fileStorage.ts
 *
 * ── STORAGE ABSTRACTION LAYER ──────────────────────────────────────────────
 * Unified interface for file uploads and deletions across the application.
 *
 * Storage Modes:
 * 1. "local"  — Saves files to local disk under `public/uploads/` (or Base64 data URL on read-only environments).
 * 2. "custom" — Hook for upcoming custom file server integration.
 */

import fs from "fs/promises";
import path from "path";

const UPLOAD_ROOT = path.join(process.cwd(), "public", "uploads");

/**
 * Converts a File to a Base64 data URL fallback when filesystem storage is unavailable (e.g., read-only serverless environments).
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
  // When your team's custom file server is ready, hook its upload function here.
  return await uploadToLocal(file, folder);
}

/**
 * Deletes a local file based on its relative URL path (/uploads/...).
 */
export async function deleteFile(url: string): Promise<void> {
  if (!url || !url.startsWith("/uploads/")) return;

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
