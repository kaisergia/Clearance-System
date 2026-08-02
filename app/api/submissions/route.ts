/**
 * app/api/submissions/route.ts
 *
 * GET /api/submissions
 * Retrieves requirement submissions filtered by officeId, departmentId, or orgId.
 */
import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { sendEvaluationResultAlert } from "@/services/notificationService";

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const officeId = searchParams.get("officeId");
    const departmentId = searchParams.get("departmentId");
    const orgId = searchParams.get("orgId");

    let reqIds: string[] = [];

    if (officeId) {
      const officeReqs = await prisma.officeRequirement.findMany({
        where: { officeId: parseInt(officeId, 10) },
      });
      reqIds = officeReqs.map((r) => r.id);
    } else if (departmentId) {
      const deptReqs = await prisma.departmentRequirement.findMany({
        where: { departmentId: parseInt(departmentId, 10) },
      });
      reqIds = deptReqs.map((r) => r.id);
    } else if (orgId) {
      const orgReqs = await prisma.orgRequirement.findMany({
        where: { orgId: parseInt(orgId, 10) },
      });
      reqIds = orgReqs.map((r) => r.id);
    } else {
      // If no filter, return all submissions
      const submissions = await prisma.requirementSubmission.findMany({
        orderBy: { submittedAt: "desc" },
      });
      return NextResponse.json(submissions);
    }

    // Fetch submissions matching the entity's requirements
    const submissions = await prisma.requirementSubmission.findMany({
      where: {
        requirementId: { in: reqIds },
      },
      orderBy: { submittedAt: "desc" },
    });

    return NextResponse.json(submissions);
  } catch (err) {
    console.error("[GET /api/submissions]", err);
    return NextResponse.json({ error: "Database error" }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { studentId, requirementId, type, uploadedFileUrls, paymentReference, surveyAnswers, acknowledged } = body;

    if (!studentId || !requirementId) {
      return NextResponse.json({ error: "studentId and requirementId are required" }, { status: 400 });
    }

    // Lookup requirement in Office, Department, and Org models to find autoApprove setting
    let isAutoApprove = false;
    let entityType: "office" | "department" | "org" | null = null;
    let entityId: number | null = null;

    const officeReq = await prisma.officeRequirement.findUnique({ where: { id: requirementId } });
    if (officeReq) {
      isAutoApprove = !!officeReq.autoApprove;
      entityType = "office";
      entityId = officeReq.officeId;
    } else {
      const deptReq = await prisma.departmentRequirement.findUnique({ where: { id: requirementId } });
      if (deptReq) {
        isAutoApprove = !!deptReq.autoApprove;
        entityType = "department";
        entityId = deptReq.departmentId;
      } else {
        const orgReq = await prisma.orgRequirement.findUnique({ where: { id: requirementId } });
        if (orgReq) {
          isAutoApprove = !!orgReq.autoApprove;
          entityType = "org";
          entityId = orgReq.orgId;
        }
      }
    }

    const submissionStatus = isAutoApprove ? "approved" : "pending";
    const todayStr = new Date().toISOString().split("T")[0];

    // Create or update the requirement submission
    const submission = await prisma.requirementSubmission.upsert({
      where: {
        studentId_requirementId: { studentId, requirementId },
      },
      update: {
        type: type || "MANUAL",
        uploadedFileUrls: uploadedFileUrls || [],
        paymentReference: paymentReference || null,
        surveyAnswers: surveyAnswers || [],
        acknowledged: !!acknowledged,
        status: submissionStatus,
        submittedAt: new Date(),
      },
      create: {
        studentId,
        requirementId,
        type: type || "MANUAL",
        uploadedFileUrls: uploadedFileUrls || [],
        paymentReference: paymentReference || null,
        surveyAnswers: surveyAnswers || [],
        acknowledged: !!acknowledged,
        status: submissionStatus,
      },
    });

    // If auto-approved, automatically mark the student's ClearanceRecord as Cleared
    if (isAutoApprove && entityType && entityId) {
      if (entityType === "office") {
        const existing = await prisma.clearanceRecord.findFirst({ where: { studentId, officeId: entityId } });
        if (existing) {
          await prisma.clearanceRecord.update({ where: { id: existing.id }, data: { status: "Cleared", dateCleared: todayStr } });
        } else {
          await prisma.clearanceRecord.create({ data: { studentId, officeId: entityId, status: "Cleared", dateCleared: todayStr } });
        }
      } else if (entityType === "department") {
        const existing = await prisma.clearanceRecord.findFirst({ where: { studentId, departmentId: entityId } });
        if (existing) {
          await prisma.clearanceRecord.update({ where: { id: existing.id }, data: { status: "Cleared", dateCleared: todayStr } });
        } else {
          await prisma.clearanceRecord.create({ data: { studentId, departmentId: entityId, status: "Cleared", dateCleared: todayStr } });
        }
      } else if (entityType === "org") {
        const existing = await prisma.clearanceRecord.findFirst({ where: { studentId, orgId: entityId } });
        if (existing) {
          await prisma.clearanceRecord.update({ where: { id: existing.id }, data: { status: "Cleared", dateCleared: todayStr } });
        } else {
          await prisma.clearanceRecord.create({ data: { studentId, orgId: entityId, status: "Cleared", dateCleared: todayStr } });
        }
      }
    }

    // Trigger alert if auto-approved
    if (isAutoApprove) {
      sendEvaluationResultAlert(studentId, requirementId, "Cleared", undefined, "Auto-Approve System Engine").catch(
        (err) => console.error("[SubmissionAlertError]", err)
      );
    }

    return NextResponse.json({
      success: true,
      submission,
      autoApproved: isAutoApprove,
      message: isAutoApprove
        ? "Requirement submitted and auto-approved by rule policy!"
        : "Requirement submitted successfully. Pending staff evaluation.",
    });
  } catch (err: any) {
    console.error("[POST /api/submissions]", err);
    return NextResponse.json({ error: "Failed to submit requirement", details: err.message }, { status: 500 });
  }
}
