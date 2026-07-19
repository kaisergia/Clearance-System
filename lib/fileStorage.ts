/**
 * lib/fileStorage.ts
 *
 * NOTE FOR FUTURE CLOUD MIGRATION:
 * To migrate to cloud storage (e.g. Cloudinary, S3, UploadThing), only this file needs to change — 
 * swap the implementation of uploadFile/deleteFile, keep the same function signatures, and every 
 * caller elsewhere in the app keeps working unmodified.
 *
 * NOTE ON SCALING/PERSISTENCE:
 * Saving files directly to public/uploads/ is a dev-only stopgap. It will not persist or scale 
 * once the application is built and deployed to a real serverless or containerised cloud platform 
 * (like Vercel, Heroku, or AWS ECS), where ephemeral filesystems are reset on each container restart.
 */
import fs from "fs/promises";
import path from "path";

// Helper to determine the local public uploads directory path
const UPLOAD_ROOT = path.join(process.cwd(), "public", "uploads");

/**
 * Saves an uploaded File object to the local filesystem under public/uploads/{folder}/
 * and returns the public relative URL path.
 */
export async function uploadFile(file: File, folder: string): Promise<string> {
  // Generate a unique filename using timestamp and random number to prevent name collisions
  const uniqueId = `${Date.now()}-${Math.floor(100 + Math.random() * 900)}`;
  const originalExt = path.extname(file.name);
  const sanitizedName = `${uniqueId}${originalExt}`;
  
  const targetDir = path.join(UPLOAD_ROOT, folder);
  const targetFilePath = path.join(targetDir, sanitizedName);

  // Ensure upload directory exists
  await fs.mkdir(targetDir, { recursive: true });

  // Read array buffer from the browser's uploaded File object
  const arrayBuffer = await file.arrayBuffer();
  const buffer = Buffer.from(arrayBuffer);

  // Write file to local disk
  await fs.writeFile(targetFilePath, buffer);

  // Return the public relative URL path
  return `/uploads/${folder}/${sanitizedName}`;
}

/**
 * Deletes a file from the local filesystem based on its public relative URL path.
 */
export async function deleteFile(url: string): Promise<void> {
  // Only process if it points to a local upload path
  if (!url.startsWith("/uploads/")) {
    return;
  }

  // Convert the URL route to the local filesystem path
  const relativePath = url.substring("/uploads/".length);
  const targetFilePath = path.join(UPLOAD_ROOT, relativePath);

  try {
    await fs.unlink(targetFilePath);
  } catch (err: any) {
    // If the file was already deleted or doesn't exist, ignore
    if (err.code !== "ENOENT") {
      console.error(`[fileStorage] Failed to delete file at: ${targetFilePath}`, err);
    }
  }
}
