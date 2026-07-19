/**
 * app/api/debug/reset/route.ts
 *
 * POST /api/debug/reset
 * Resets all submission data and clearance statuses for recreation/testing.
 * Supports resetting ALL students or a single specific student.
 *
 * Body: { studentId?: string }  — omit for full reset
 */
import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import fs from "fs";
import path from "path";

export async function POST(req: NextRequest) {
  try {
    const body = await req.json().catch(() => ({}));
    const { studentId } = body as { studentId?: string };

    const whereStudent = studentId ? { studentId } : {};

    // 1. Collect uploaded file URLs before deleting
    const submissions = await prisma.requirementSubmission.findMany({
      where: whereStudent,
      select: { uploadedFileUrls: true },
    });

    // 2. Delete uploaded files from disk (best-effort)
    for (const sub of submissions) {
      try {
        const urls: string[] = Array.isArray(sub.uploadedFileUrls)
          ? (sub.uploadedFileUrls as string[])
          : JSON.parse(String(sub.uploadedFileUrls) || "[]");
        for (const url of urls) {
          if (url && url.startsWith("/uploads/")) {
            const filePath = path.join(process.cwd(), "public", url);
            if (fs.existsSync(filePath)) fs.unlinkSync(filePath);
          }
        }
      } catch {
        // Non-fatal
      }
    }

    // 3. Delete all RequirementSubmission records
    await prisma.requirementSubmission.deleteMany({ where: whereStudent });

    // 4. Reset ClearanceRecord statuses
    await prisma.clearanceRecord.updateMany({
      where: whereStudent,
      data: {
        status: "Pending",
        remarks: null,
        dateCleared: null,
        completedTasks: [],
        uploadedFiles: {},
      },
    });

    // 5. Reset Student.status
    if (studentId) {
      await prisma.student.update({
        where: { id: studentId },
        data: { status: "Pending" },
      });
    } else {
      await prisma.student.updateMany({ data: { status: "Pending" } });
    }

    return NextResponse.json({
      ok: true,
      message: studentId
        ? `Reset complete for student ${studentId}.`
        : "Full reset complete. All submissions and clearance statuses cleared.",
    });
  } catch (err) {
    console.error("[POST /api/debug/reset]", err);
    return NextResponse.json({ error: "Reset failed" }, { status: 500 });
  }
}
