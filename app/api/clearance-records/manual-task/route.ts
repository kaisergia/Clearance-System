/**
 * app/api/clearance-records/manual-task/route.ts
 *
 * POST /api/clearance-records/manual-task
 * Allows an office/dept/org evaluator to mark or unmark a MANUAL task
 * as completed for a specific student's ClearanceRecord.
 *
 * Body: { studentId, entityType: "office"|"department"|"org", entityId, taskIndex, completed }
 */
import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function POST(req: NextRequest) {
  try {
    const { studentId, entityType, entityId, taskIndex, completed } = await req.json();

    if (!studentId || !entityType || entityId == null || taskIndex == null) {
      return NextResponse.json({ error: "Missing required fields" }, { status: 400 });
    }

    // 1. Find the ClearanceRecord for this student + entity
    const whereClause: any = { studentId };
    if (entityType === "office") whereClause.officeId = Number(entityId);
    else if (entityType === "department") whereClause.departmentId = Number(entityId);
    else if (entityType === "org") whereClause.orgId = Number(entityId);
    else return NextResponse.json({ error: "Invalid entityType" }, { status: 400 });

    const record = await prisma.clearanceRecord.findFirst({ where: whereClause });
    if (!record) {
      return NextResponse.json({ error: "Clearance record not found" }, { status: 404 });
    }

    // 2. Update the completedTasks array
    const current: number[] = (record.completedTasks as number[]) || [];
    let updated: number[];
    if (completed) {
      // Add taskIndex if not already present
      updated = current.includes(taskIndex) ? current : [...current, taskIndex];
    } else {
      // Remove taskIndex
      updated = current.filter((i) => i !== taskIndex);
    }

    // 3. Determine whether ALL applicable requirements are now satisfied
    //    so we can flip the overall ClearanceRecord status to Cleared.
    const student = await prisma.student.findUnique({ where: { id: studentId } });

    let allEntityReqs: any[] = [];
    if (entityType === "office") {
      allEntityReqs = await prisma.officeRequirement.findMany({ where: { officeId: Number(entityId), status: "Live" } });
    } else if (entityType === "department") {
      allEntityReqs = await prisma.departmentRequirement.findMany({ where: { departmentId: Number(entityId), status: "Live" } });
    } else if (entityType === "org") {
      allEntityReqs = await prisma.orgRequirement.findMany({ where: { orgId: Number(entityId), status: "Live" } });
    }

    const isApplicable = (r: any) => {
      const appliesTo = (r.appliesTo as string[]) || [];
      if (appliesTo.length === 0 || appliesTo.includes("All Students")) return true;
      return (
        appliesTo.includes(student?.program) ||
        appliesTo.includes(student?.department) ||
        appliesTo.includes(student?.year)
      );
    };

    const applicableReqs = allEntityReqs.filter(isApplicable);

    const studentSubmissions = await prisma.requirementSubmission.findMany({
      where: {
        studentId,
        requirementId: { in: applicableReqs.map((r) => r.id) },
      },
    });

    let allCleared = true;
    for (let idx = 0; idx < applicableReqs.length; idx++) {
      const req = applicableReqs[idx];
      if (req.type === "MANUAL") {
        if (!updated.includes(idx)) { allCleared = false; break; }
      } else {
        const sub = studentSubmissions.find((s) => s.requirementId === req.id);
        if (!sub || sub.status !== "approved") { allCleared = false; break; }
      }
    }

    // 4. Persist the updated completedTasks and status
    const updatedRecord = await prisma.clearanceRecord.update({
      where: { id: record.id },
      data: {
        completedTasks: updated,
        status: allCleared ? "Cleared" : record.status === "Cleared" ? "Submitted" : record.status,
        remarks: allCleared ? "" : record.remarks, // clear stale remarks on full clearance
        dateCleared: allCleared
          ? new Date().toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" })
          : null,
      },
    });

    // 5. Update overall student status
    const allRecords = await prisma.clearanceRecord.findMany({ where: { studentId } });
    const overallCleared = allRecords.length > 0 && allRecords.every((r) => r.status === "Cleared");
    await prisma.student.update({
      where: { id: studentId },
      data: { status: overallCleared ? "Cleared" : "Pending" },
    });

    return NextResponse.json({ ok: true, record: updatedRecord, completedTasks: updated, allCleared });
  } catch (err) {
    console.error("[POST /api/clearance-records/manual-task]", err);
    return NextResponse.json({ error: "Failed to update manual task" }, { status: 500 });
  }
}
