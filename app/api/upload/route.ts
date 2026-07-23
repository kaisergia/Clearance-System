import { NextRequest, NextResponse } from "next/server";
import { uploadFile } from "@/lib/fileStorage";

export async function POST(req: NextRequest) {
  try {
    const formData = await req.formData();
    const folder = (formData.get("folder") as string) || "announcements";
    const files = formData.getAll("files") as File[];

    const uploadTargetFiles: File[] = [];
    if (files && files.length > 0) {
      uploadTargetFiles.push(...files);
    } else {
      const singleFile = formData.get("file") as File;
      if (singleFile && singleFile.name && singleFile.size > 0) {
        uploadTargetFiles.push(singleFile);
      }
    }

    if (uploadTargetFiles.length === 0) {
      return NextResponse.json({ error: "No files provided" }, { status: 400 });
    }

    const urls: string[] = [];
    for (const file of uploadTargetFiles) {
      if (file && file.name && file.size > 0) {
        const url = await uploadFile(file, folder);
        urls.push(url);
      }
    }

    return NextResponse.json({ urls, url: urls[0] ?? null });
  } catch (err) {
    console.error("[POST /api/upload]", err);
    return NextResponse.json({ error: "Upload failed" }, { status: 500 });
  }
}
