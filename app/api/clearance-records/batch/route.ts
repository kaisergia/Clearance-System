/**
 * app/api/clearance-records/batch/route.ts
 *
 * POST /api/clearance-records/batch
 * Handles bulk CSV deficiency imports and batch clearance status updates
 * for Office, Department, or Org evaluators.
 *
 * Body: {
 *   entityType: "office" | "department" | "org",
 *   entityId: number,
 *   records: Array<{ studentId: string; status: "Cleared" | "Pending"; remarks?: string }>
 * }
 */
import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { logBatchClearanceAction } from "@/services/auditService";
import { checkPrerequisites } from "@/lib/clearancePrereqs";

export async function POST(req: NextRequest) {
  try {
    const { entityType, entityId, records } = await req.json();

    if (!entityType || !entityId || !Array.isArray(records) || records.length === 0) {
      return NextResponse.json(
        { error: "Invalid payload. entityType, entityId, and a non-empty records array are required." },
        { status: 400 }
      );
    }

    const numEntityId = Number(entityId);
    if (isNaN(numEntityId)) {
      return NextResponse.json({ error: "Invalid entityId" }, { status: 400 });
    }

    // Extract all unique student IDs from payload
    const studentIds = Array.from(new Set(records.map((r: any) => String(r.studentId).trim()))).filter(Boolean);

    // Verify which students exist in the DB
    const existingStudents = await prisma.student.findMany({
      where: { id: { in: studentIds } },
      select: { id: true, name: true }
    });

    const existingStudentIdSet = new Set(existingStudents.map((s) => s.id));
    const missingStudents = studentIds.filter((id) => !existingStudentIdSet.has(id));

    const todayStr = new Date().toISOString().split("T")[0];

    // Find active term
    const activeTerm = await prisma.academicTerm.findFirst({
      where: { status: "Active" },
    });
    const termId = activeTerm?.id || null;

    if (!termId) {
      return NextResponse.json({ error: "No active academic term exists." }, { status: 403 });
    }

    // Check if the signatory is declared in the active published clearance flow
    const activeFlows = await prisma.clearanceFlow.findMany({
      where: { termId, status: "Published" },
      include: { steps: true },
    });

    const isDeclared = activeFlows.some((flow) =>
      flow.steps.some((step) => 
        (entityType === "office" && step.officeId === numEntityId) ||
        (entityType === "department" && (step.departmentId === numEntityId || step.isDynamicDept)) ||
        (entityType === "org" && (step.orgId === numEntityId || step.isDynamicOrgs))
      )
    );

    if (!isDeclared) {
      return NextResponse.json({ error: "Your signatory office is not declared in the active published clearance flow. Evaluation is locked." }, { status: 403 });
    }

    // Filter payload to valid students only
    const validRecords = records.filter((r: any) => existingStudentIdSet.has(String(r.studentId).trim()));

    // Prepare Prisma operations based on entityType
    let updatedCount = 0;
    const prereqSkipped: string[] = [];

    await prisma.$transaction(async (tx) => {
      for (const item of validRecords) {
        const sid = String(item.studentId).trim();
        let status = item.status === "Cleared" ? "Cleared" : "Pending";
        let remarks = item.remarks ? String(item.remarks).trim() : null;

        if (status === "Cleared" && termId) {
          const prereqCheck = await checkPrerequisites(sid, termId, entityType as any, numEntityId);
          if (!prereqCheck.allowed) {
            status = "Pending";
            const warningMsg = `[Prerequisite Warning] ${prereqCheck.error}`;
            remarks = remarks ? `${remarks} (${warningMsg})` : warningMsg;
            prereqSkipped.push(sid);
          }
        }

        const dateCleared = status === "Cleared" ? todayStr : null;

        if (entityType === "office") {
          const existing = await tx.clearanceRecord.findFirst({ where: { studentId: sid, officeId: numEntityId, termId } });
          if (existing) {
            await tx.clearanceRecord.update({ where: { id: existing.id }, data: { status, remarks, dateCleared } });
          } else {
            await tx.clearanceRecord.create({ data: { studentId: sid, officeId: numEntityId, termId, status, remarks, dateCleared } });
          }
        } else if (entityType === "department") {
          const existing = await tx.clearanceRecord.findFirst({ where: { studentId: sid, departmentId: numEntityId, termId } });
          if (existing) {
            await tx.clearanceRecord.update({ where: { id: existing.id }, data: { status, remarks, dateCleared } });
          } else {
            await tx.clearanceRecord.create({ data: { studentId: sid, departmentId: numEntityId, termId, status, remarks, dateCleared } });
          }
        } else if (entityType === "org") {
          const existing = await tx.clearanceRecord.findFirst({ where: { studentId: sid, orgId: numEntityId, termId } });
          if (existing) {
            await tx.clearanceRecord.update({ where: { id: existing.id }, data: { status, remarks, dateCleared } });
          } else {
            await tx.clearanceRecord.create({ data: { studentId: sid, orgId: numEntityId, termId, status, remarks, dateCleared } });
          }
        }
        updatedCount++;
      }
    });

    // Record audit log for batch operation
    logBatchClearanceAction(
      `${entityType.toUpperCase()} Evaluator`,
      entityType,
      updatedCount,
      "auto",
      entityType,
      numEntityId,
      `${entityType.toUpperCase()} #${numEntityId}`
    ).catch((err) => console.error("[AuditBatchLogError]", err));

    return NextResponse.json({
      success: true,
      totalRequested: records.length,
      updatedCount,
      prereqSkippedCount: prereqSkipped.length,
      prereqSkipped,
      missingStudents,
      message: prereqSkipped.length > 0
        ? `Processed updates. Note: ${prereqSkipped.length} student(s) could not be cleared due to unmet prerequisites (kept as Pending with warning remarks).`
        : `Successfully processed batch updates for ${updatedCount} constituents.`
    });
  } catch (err: any) {
    console.error("Batch clearance update failed:", err);
    return NextResponse.json(
      { error: "Failed to process batch clearance updates.", details: err.message },
      { status: 500 }
    );
  }
}
