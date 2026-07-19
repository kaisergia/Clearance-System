/**
 * app/api/student-requirements/submit/route.ts
 *
 * POST /api/student-requirements/submit
 * Handles student submission for a specific requirement (Survey, Acknowledgment, Document, Payment Proof).
 */
import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { uploadFile } from "@/lib/fileStorage";
import { RequirementType } from "@prisma/client";

export async function POST(req: NextRequest) {
  try {
    const formData = await req.formData();
    const studentId = formData.get("studentId") as string;
    const requirementId = formData.get("requirementId") as string;
    const typeStr = formData.get("type") as string;
    const paymentReference = (formData.get("paymentReference") as string) || null;
    const surveyAnswersStr = formData.get("surveyAnswers") as string;
    const acknowledgedStr = formData.get("acknowledged") as string;

    if (!studentId || !requirementId || !typeStr) {
      return NextResponse.json({ error: "Missing required fields" }, { status: 400 });
    }

    const type = typeStr as RequirementType;

    // 1. Process file uploads if applicable
    const fileUrls: string[] = [];
    const uploadedFiles = formData.getAll("files") as File[];
    
    for (const file of uploadedFiles) {
      if (file && file.name && file.size > 0) {
        // Save to type-specific folder (e.g. document_upload, payment_proof)
        const folder = type.toLowerCase();
        const url = await uploadFile(file, folder);
        fileUrls.push(url);
      }
    }

    // 2. Parse survey answers if present
    let surveyAnswers: any = [];
    if (surveyAnswersStr) {
      try {
        surveyAnswers = JSON.parse(surveyAnswersStr);
      } catch (e) {
        console.error("Failed to parse survey answers:", e);
      }
    }

    // 3. Parse acknowledgment flag
    const acknowledged = acknowledgedStr === "true";

    // 4. Create or update the RequirementSubmission record in the database
    const submission = await prisma.requirementSubmission.upsert({
      where: {
        studentId_requirementId: { studentId, requirementId },
      },
      update: {
        type,
        uploadedFileUrls: fileUrls,
        paymentReference,
        surveyAnswers,
        acknowledged,
        status: "pending",
        submittedAt: new Date(),
        reviewedBy: null,
        reviewNotes: null,
      },
      create: {
        requirementId,
        studentId,
        type,
        uploadedFileUrls: fileUrls,
        paymentReference,
        surveyAnswers,
        acknowledged,
        status: "pending",
      },
    });

    // 5. Update the corresponding ClearanceRecord status to "Submitted" (Under Review)
    // Find the requirement first across the three tables to locate the owner entity
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
        if (orgReq) {
          orgId = orgReq.orgId;
        }
      }
    }

    if (officeId || departmentId || orgId) {
      // Find the existing ClearanceRecord
      const clearanceRecord = await prisma.clearanceRecord.findFirst({
        where: {
          studentId,
          ...(officeId && { officeId }),
          ...(departmentId && { departmentId }),
          ...(orgId && { orgId }),
        },
      });

      if (clearanceRecord) {
        // Sync ClearanceRecord: set status to "Submitted" (Under Review)
        // Also save file urls inside the old uploadedFiles json field for backward compatibility
        const currentFiles = (clearanceRecord.uploadedFiles as Record<string, string>) || {};
        if (fileUrls.length > 0) {
          currentFiles[requirementId] = fileUrls[0]; // save first file path
        }

        await prisma.clearanceRecord.update({
          where: { id: clearanceRecord.id },
          data: {
            status: "Submitted",
            uploadedFiles: currentFiles,
          },
        });
      }
    }

    return NextResponse.json({ ok: true, submission });
  } catch (err) {
    console.error("[POST /api/student-requirements/submit]", err);
    return NextResponse.json({ error: "Submission failed" }, { status: 500 });
  }
}
