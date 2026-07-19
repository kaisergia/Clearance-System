/**
 * app/api/submissions/[submissionId]/cancel/route.ts
 *
 * DELETE /api/submissions/[submissionId]/cancel
 * Allows a student to retract/cancel a pending submission.
 * Only cancels submissions with status "pending" — approved/rejected are locked.
 * Reverts the parent ClearanceRecord status to "Pending" if no other submissions exist.
 */
import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import fs from "fs";
import path from "path";

export async function DELETE(
  _req: NextRequest,
  { params }: { params: Promise<{ submissionId: string }> }
) {
  try {
    const { submissionId } = await params;

    // 1. Find the submission
    const submission = await prisma.requirementSubmission.findUnique({
      where: { id: submissionId },
    });

    if (!submission) {
      return NextResponse.json({ error: "Submission not found" }, { status: 404 });
    }

    if (submission.status !== "pending") {
      return NextResponse.json(
        { error: "Only pending submissions can be cancelled." },
        { status: 400 }
      );
    }

    const { studentId, requirementId } = submission;

    // 2. Delete uploaded files from disk (best-effort — don't fail if missing)
    try {
      const urls: string[] = Array.isArray(submission.uploadedFileUrls)
        ? (submission.uploadedFileUrls as string[])
        : JSON.parse(String(submission.uploadedFileUrls) || "[]");

      for (const url of urls) {
        if (url && url.startsWith("/uploads/")) {
          const filePath = path.join(process.cwd(), "public", url);
          if (fs.existsSync(filePath)) {
            fs.unlinkSync(filePath);
          }
        }
      }
    } catch {
      // Non-fatal — continue with DB cleanup
    }

    // 3. Delete the submission record
    await prisma.requirementSubmission.delete({ where: { id: submissionId } });

    // 4. Find the parent ClearanceRecord and revert its status if needed
    //    Identify which entity owns this requirement
    let officeId: number | null = null;
    let departmentId: number | null = null;
    let orgId: number | null = null;

    const officeReq = await prisma.officeRequirement.findUnique({ where: { id: requirementId } });
    if (officeReq) {
      officeId = officeReq.officeId;
    } else {
      const deptReq = await prisma.departmentRequirement.findUnique({ where: { id: requirementId } });
      if (deptReq) {
        departmentId = deptReq.departmentId;
      } else {
        const orgReq = await prisma.orgRequirement.findUnique({ where: { id: requirementId } });
        if (orgReq) orgId = orgReq.orgId;
      }
    }

    if (officeId || departmentId || orgId) {
      const clearanceRecord = await prisma.clearanceRecord.findFirst({
        where: {
          studentId,
          ...(officeId && { officeId }),
          ...(departmentId && { departmentId }),
          ...(orgId && { orgId }),
        },
      });

      if (clearanceRecord && clearanceRecord.status === "Submitted") {
        // Check if any other pending/approved submissions still exist for this entity's requirements
        let entityReqIds: string[] = [];
        if (officeId) {
          const reqs = await prisma.officeRequirement.findMany({ where: { officeId, status: "Live" } });
          entityReqIds = reqs.map((r) => r.id);
        } else if (departmentId) {
          const reqs = await prisma.departmentRequirement.findMany({ where: { departmentId, status: "Live" } });
          entityReqIds = reqs.map((r) => r.id);
        } else if (orgId) {
          const reqs = await prisma.orgRequirement.findMany({ where: { orgId, status: "Live" } });
          entityReqIds = reqs.map((r) => r.id);
        }

        const remainingSubmissions = await prisma.requirementSubmission.findMany({
          where: {
            studentId,
            requirementId: { in: entityReqIds },
          },
        });

        // If no more submissions at all, revert to Pending
        if (remainingSubmissions.length === 0) {
          await prisma.clearanceRecord.update({
            where: { id: clearanceRecord.id },
            data: { status: "Pending", remarks: null },
          });
        }
        // If there are still other submissions, keep Submitted status
      }
    }

    return NextResponse.json({ ok: true, message: "Submission cancelled successfully." });
  } catch (err) {
    console.error("[DELETE /api/submissions/[submissionId]/cancel]", err);
    return NextResponse.json({ error: "Failed to cancel submission" }, { status: 500 });
  }
}
