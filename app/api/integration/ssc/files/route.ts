import { NextResponse } from "next/server";
import { 
  uploadSSCFile, 
  getSSCPresignedUrl, 
  listSSCFiles, 
  deleteSSCFile 
} from "@/services/sscIntegrationService";

// GET /api/integration/ssc/files (List files or get presigned URL)
export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const path = searchParams.get("path");
    const prefix = searchParams.get("prefix") || undefined;
    const maxKeys = searchParams.get("maxKeys") ? Number(searchParams.get("maxKeys")) : 100;
    const startAfter = searchParams.get("startAfter") || undefined;

    // If path is specified, return presigned download URL
    if (path) {
      const presigned = await getSSCPresignedUrl(path);
      return NextResponse.json(presigned);
    }

    // Otherwise list files
    const fileList = await listSSCFiles(prefix, maxKeys, startAfter);
    return NextResponse.json(fileList);
  } catch (err: any) {
    console.error("SSC Files GET error:", err);
    return NextResponse.json(
      { error: err.message || "Failed to process SSC file request" },
      { status: 500 }
    );
  }
}

// POST /api/integration/ssc/files (Upload file)
export async function POST(request: Request) {
  try {
    const formData = await request.formData();
    const file = formData.get("file") as File | null;
    const path = formData.get("path") as string | null;

    if (!file || !path) {
      return NextResponse.json(
        { error: "Both 'file' and 'path' parameters are required." },
        { status: 400 }
      );
    }

    const arrayBuffer = await file.arrayBuffer();
    const buffer = Buffer.from(arrayBuffer);
    const result = await uploadSSCFile(buffer, path, file.name);

    return NextResponse.json(result, { status: 201 });
  } catch (err: any) {
    console.error("SSC Files POST error:", err);
    return NextResponse.json(
      { error: err.message || "Failed to upload file to SSC file server" },
      { status: 500 }
    );
  }
}

// DELETE /api/integration/ssc/files (Delete file)
export async function DELETE(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const path = searchParams.get("path");

    if (!path) {
      return NextResponse.json(
        { error: "Query parameter 'path' is required for file deletion." },
        { status: 400 }
      );
    }

    const deleted = await deleteSSCFile(path);
    return NextResponse.json({ success: deleted });
  } catch (err: any) {
    console.error("SSC Files DELETE error:", err);
    return NextResponse.json(
      { error: err.message || "Failed to delete file from SSC file server" },
      { status: 500 }
    );
  }
}
