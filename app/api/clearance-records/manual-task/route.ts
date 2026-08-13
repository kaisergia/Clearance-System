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
import { sendEvaluationResultAlert } from "@/services/notificationService";
import { logClearanceAction, recordAuditLog } from "@/services/auditService";
import { checkPrerequisites } from "@/lib/clearancePrereqs";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/authOptions";

const PROGRAM_MAP: Record<string, string> = {
  "BS Computer Science": "BSCS",
  "BS Information Technology": "BSIT",
  "BS Business Administration": "BSBA",
  "BS Accountancy": "BSA",
  "BS Civil Engineering": "BSCE",
  "BS Mechanical Engineering": "BSME",
  "BS Electrical Engineering": "BSEE",
  "BS Data Science": "BSDS",
  "BS Applied Mathematics": "BSAM",
  "BS Nursing": "BSN",
  "BS Pharmacy": "BSP",
  "BS Medical Technology": "BSMT",
  "BS Hospitality Management": "BSHM",
};

const normalizeProg = (p: string) => {
  return PROGRAM_MAP[p] || p;
};

const matchProg = (p1: string, p2: string) => {
  return normalizeProg(p1) === normalizeProg(p2);
};

export async function POST(req: NextRequest) {
  try {
    const { studentId, entityType, entityId, taskIndex, completed } = await req.json();

    if (!studentId || !entityType || entityId == null || taskIndex == null) {
      return NextResponse.json({ error: "Missing required fields" }, { status: 400 });
    }

    // Find active term
    const activeTerm = await prisma.academicTerm.findFirst({
      where: { status: "Active" },
    });
    const termId = activeTerm?.id || null;

    // 1. Find the ClearanceRecord for this student + entity + term
    const whereClause: any = { studentId, termId };
    if (entityType === "office") whereClause.officeId = Number(entityId);
    else if (entityType === "department") whereClause.departmentId = Number(entityId);
    else if (entityType === "org") whereClause.orgId = Number(entityId);
    else return NextResponse.json({ error: "Invalid entityType" }, { status: 400 });

    let record = await prisma.clearanceRecord.findFirst({ where: whereClause });
    if (!record) {
      record = await prisma.clearanceRecord.create({
        data: {
          studentId,
          termId,
          ...(entityType === "office" ? { officeId: Number(entityId) } : {}),
          ...(entityType === "department" ? { departmentId: Number(entityId) } : {}),
          ...(entityType === "org" ? { orgId: Number(entityId) } : {}),
          status: "Pending",
          completedTasks: [],
        },
      });
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
      allEntityReqs = await prisma.officeRequirement.findMany({ where: { officeId: Number(entityId), status: "Live", termId: termId || undefined } });
    } else if (entityType === "department") {
      allEntityReqs = await prisma.departmentRequirement.findMany({ where: { departmentId: Number(entityId), status: "Live", termId: termId || undefined } });
    } else if (entityType === "org") {
      allEntityReqs = await prisma.orgRequirement.findMany({ where: { orgId: Number(entityId), status: "Live", termId: termId || undefined } });
    }

    const parseAppliesTo = (appliesTo: any): string[] => {
      if (!appliesTo) return ["All Students"];
      if (Array.isArray(appliesTo)) return appliesTo;
      if (typeof appliesTo === "string") {
        try {
          const parsed = JSON.parse(appliesTo);
          if (Array.isArray(parsed)) return parsed;
          return [appliesTo];
        } catch {
          return [appliesTo];
        }
      }
      return ["All Students"];
    };

    const isApplicable = (r: any) => {
      const appliesTo = parseAppliesTo(r.appliesTo);
      if (appliesTo.length === 0 || appliesTo.includes("All Students")) return true;

      const studentIdFilters = appliesTo.filter(
        (item) => !["CCIS", "COE", "CEDAS", "CHS", "CABE", "All Students"].includes(item) &&
                  !item.startsWith("BS") && !item.includes("Year")
      );

      if (studentIdFilters.length > 0) {
        if (studentIdFilters.includes(studentId)) return true;
        const hasGroupFilters = appliesTo.some(
          (item) => ["CCIS", "COE", "CEDAS", "CHS", "CABE"].includes(item) || item.startsWith("BS") || item.includes("Year")
        );
        if (!hasGroupFilters) return false;
      }

      return (
        appliesTo.includes(studentId) ||
        (student?.program ? (appliesTo.includes(student.program) || appliesTo.some((item) => matchProg(item, student.program))) : false) ||
        (student?.department ? appliesTo.includes(student.department) : false) ||
        (student?.year ? appliesTo.includes(student.year) : false)
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

    if (completed && allCleared && termId) {
      const prereqCheck = await checkPrerequisites(studentId, termId, entityType as any, Number(entityId));
      if (!prereqCheck.allowed) {
        return NextResponse.json(
          { error: prereqCheck.error },
          { status: 400 }
        );
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
    const allRecords = await prisma.clearanceRecord.findMany({ where: { studentId, termId } });
    const overallCleared = allRecords.length > 0 && allRecords.every((r) => r.status === "Cleared");
    await prisma.student.update({
      where: { id: studentId },
      data: { status: overallCleared ? "Cleared" : "Pending" },
    });

    // 6. Record Audit Log
    try {
      const session = await getServerSession(authOptions);
      const actorName = session?.user?.name || session?.user?.email || "Signatory Evaluator";
      const actorRole = (session?.user as any)?.role || "head_office";

      const taskName = applicableReqs[taskIndex]?.name || `Manual Task #${taskIndex + 1}`;
      const studentName = student?.name || "Student";

      let entityName = "Signatory";
      if (entityType === "office") {
        const o = await prisma.office.findUnique({ where: { id: Number(entityId) }, select: { name: true } });
        if (o) entityName = o.name;
      } else if (entityType === "department") {
        const d = await prisma.department.findUnique({ where: { id: Number(entityId) }, select: { name: true } });
        if (d) entityName = d.name;
      } else if (entityType === "org") {
        const og = await prisma.org.findUnique({ where: { id: Number(entityId) }, select: { name: true } });
        if (og) entityName = og.name;
      }

      const actionText = completed ? "completed" : "incomplete";
      const details = `${actorName} (${actorRole}) marked manual task "${taskName}" as ${actionText} for Student ${studentId} (${studentName}).`;

      await recordAuditLog({
        actorId: session?.user?.email || undefined,
        actorName,
        actorRole,
        action: completed ? "CLEAR_STUDENT" : "UNCLEAR_STUDENT",
        targetStudentId: studentId,
        targetStudentName: studentName,
        entityType,
        entityId: String(entityId),
        entityName,
        details,
      });

      // Dispatch Student In-App Notification & Alert
      await sendEvaluationResultAlert(
        studentId,
        taskName,
        completed ? "Cleared" : "Pending",
        completed ? `Marked as completed by ${entityName}` : `Marked as incomplete by ${entityName}`,
        actorName
      );
    } catch (auditErr) {
      console.error("[ManualTask API] Failed to log audit/notification event:", auditErr);
    }

    return NextResponse.json({ ok: true, record: updatedRecord, completedTasks: updated, allCleared });
  } catch (err) {
    console.error("[POST /api/clearance-records/manual-task]", err);
    return NextResponse.json({ error: "Failed to update manual task" }, { status: 500 });
  }
}
