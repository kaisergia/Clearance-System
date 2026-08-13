/**
 * app/api/submissions/[submissionId]/evaluate/route.ts
 *
 * POST /api/submissions/[submissionId]/evaluate
 * Evaluates a student's requirement submission (approve or reject).
 */
import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { checkPrerequisites } from "@/lib/clearancePrereqs";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/authOptions";
import { recordAuditLog } from "@/services/auditService";
import { sendEvaluationResultAlert } from "@/services/notificationService";

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

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ submissionId: string }> }
) {
  try {
    const { submissionId } = await params;
    const { status, reviewedBy, reviewNotes } = await req.json();

    if (!submissionId || !status) {
      return NextResponse.json({ error: "Missing required fields" }, { status: 400 });
    }

    if (status !== "approved" && status !== "rejected") {
      return NextResponse.json({ error: "Invalid status value" }, { status: 400 });
    }

    // Load the existing submission
    const existingSubmission = await prisma.requirementSubmission.findUnique({
      where: { id: submissionId },
    });

    if (!existingSubmission) {
      return NextResponse.json({ error: "Submission not found" }, { status: 404 });
    }

    const { studentId, requirementId } = existingSubmission;

    // Identify the owner entity of the requirement
    let officeId: number | null = null;
    let departmentId: number | null = null;
    let orgId: number | null = null;
 
    let officeReq = null;
    let deptReq = null;
    let orgReq = null;
 
    officeReq = await prisma.officeRequirement.findUnique({ where: { id: requirementId } });
    if (officeReq) {
      officeId = officeReq.officeId;
    } else {
      deptReq = await prisma.departmentRequirement.findUnique({ where: { id: requirementId } });
      if (deptReq) {
        departmentId = deptReq.departmentId;
      } else {
        orgReq = await prisma.orgRequirement.findUnique({ where: { id: requirementId } });
        if (orgReq) {
          orgId = orgReq.orgId;
        }
      }
    }

    // Check prerequisites first if evaluating to approved
    if (status === "approved") {
      const activeTerm = await prisma.academicTerm.findFirst({
        where: { status: "Active" },
      });
      const termId = activeTerm?.id || null;

      if (termId) {
        const entityType = officeId ? "office" : departmentId ? "department" : "org";
        const entityVal = officeId || departmentId || orgId;
        if (entityVal) {
          const prereqCheck = await checkPrerequisites(studentId, termId, entityType, entityVal);
          if (!prereqCheck.allowed) {
            return NextResponse.json(
              { error: prereqCheck.error },
              { status: 400 }
            );
          }
        }
      }
    }

    // Now safe to update the submission record
    const submission = await prisma.requirementSubmission.update({
      where: { id: submissionId },
      data: {
        status,
        reviewedBy,
        reviewNotes: status === "rejected" ? reviewNotes : null,
      },
    });

    if (officeId || departmentId || orgId) {
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
          (officeId && step.officeId === officeId) ||
          (departmentId && (step.departmentId === departmentId || step.isDynamicDept)) ||
          (orgId && (step.orgId === orgId || step.isDynamicOrgs))
        )
      );

      if (!isDeclared) {
        return NextResponse.json({ error: "This signatory is not declared in the active published clearance flow. Evaluation is locked." }, { status: 403 });
      }

      // Find the corresponding ClearanceRecord for the active term
      const clearanceRecord = await prisma.clearanceRecord.findFirst({
        where: {
          studentId,
          termId,
          ...(officeId && { officeId }),
          ...(departmentId && { departmentId }),
          ...(orgId && { orgId }),
        },
      });

      if (clearanceRecord) {
        if (status === "rejected") {
          // If rejected, set overall clearance status to "Rejected"
          await prisma.clearanceRecord.update({
            where: { id: clearanceRecord.id },
            data: {
              status: "Rejected",
            },
          });
        } else {
          // If approved, we need to check if ALL other requirements for this entity are cleared
          const student = await prisma.student.findUnique({ where: { id: studentId } });
          
          if (student) {
            // Helper to check program/dept/year matching
            const isApplicable = (r: any) => {
              const appliesTo = (r.appliesTo as string[]) || [];
              if (appliesTo.length === 0 || appliesTo.includes("All Students")) return true;
              return (
                appliesTo.includes(student.id) ||
                appliesTo.some((item) => matchProg(item, student.program)) ||
                appliesTo.includes(student.department) ||
                appliesTo.includes(student.year)
              );
            };

            // Get all requirements for this specific entity for the active term
            let allEntityReqs: any[] = [];
            if (officeId) {
              allEntityReqs = await prisma.officeRequirement.findMany({ where: { officeId, status: "Live", termId: termId || undefined } });
            } else if (departmentId) {
              allEntityReqs = await prisma.departmentRequirement.findMany({ where: { departmentId, status: "Live", termId: termId || undefined } });
            } else if (orgId) {
              allEntityReqs = await prisma.orgRequirement.findMany({ where: { orgId, status: "Live", termId: termId || undefined } });
            }

            // Filter down to only those applicable to this student
            const applicableReqs = allEntityReqs.filter(isApplicable);

            // Fetch all submissions for this student for these requirements
            const studentSubmissions = await prisma.requirementSubmission.findMany({
              where: {
                studentId,
                requirementId: { in: applicableReqs.map(r => r.id) }
              }
            });

            // Read currently completed manual tasks from the record
            const completedTasksIdx = (clearanceRecord.completedTasks as number[]) || [];

            // A requirement is cleared if:
            // - It is MANUAL and its index in the applicable list matches the completedTasks checklist, or
            // - It has a corresponding submission with status "approved"
            let allCleared = true;
            for (let idx = 0; idx < applicableReqs.length; idx++) {
              const req = applicableReqs[idx];
              if (req.type === "MANUAL") {
                // Check if this task index is marked as completed
                if (!completedTasksIdx.includes(idx)) {
                  allCleared = false;
                  break;
                }
              } else {
                // Find submission for this requirement
                const sub = studentSubmissions.find(s => s.requirementId === req.id);
                if (!sub || sub.status !== "approved") {
                  allCleared = false;
                  break;
                }
              }
            }

            // Update ClearanceRecord status based on allCleared check

            await prisma.clearanceRecord.update({
              where: { id: clearanceRecord.id },
              data: {
                status: allCleared ? "Cleared" : "Submitted",
                remarks: allCleared ? "" : "Some requirements are approved. Waiting for remaining reviews.",
                dateCleared: allCleared 
                  ? new Date().toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" })
                  : null,
              },
            });

            // Trigger sync of overall student status for the active term
            const allRecords = await prisma.clearanceRecord.findMany({ where: { studentId, termId } });
            const overallCleared = allRecords.length > 0 && allRecords.every(r => r.status === "Cleared");
            await prisma.student.update({
              where: { id: studentId },
              data: { status: overallCleared ? "Cleared" : "Pending" }
            });
          }
        }
      }
    }

    // 3. Record Audit Log
    try {
      const session = await getServerSession(authOptions);
      const actorName = session?.user?.name || session?.user?.email || reviewedBy || "Signatory Evaluator";
      const actorRole = (session?.user as any)?.role || "head_office";

      const reqObj = officeReq || deptReq || orgReq;
      const reqName = reqObj?.name || "Requirement";

      const student = await prisma.student.findUnique({ where: { id: studentId }, select: { name: true } });
      const studentName = student?.name || "Student";

      const entityType = officeId ? "office" : departmentId ? "department" : "org";
      const entityVal = officeId || departmentId || orgId;
      let entityName = "Signatory";
      if (officeId) {
        const o = await prisma.office.findUnique({ where: { id: officeId }, select: { name: true } });
        if (o) entityName = o.name;
      } else if (departmentId) {
        const d = await prisma.department.findUnique({ where: { id: departmentId }, select: { name: true } });
        if (d) entityName = d.name;
      } else if (orgId) {
        const og = await prisma.org.findUnique({ where: { id: orgId }, select: { name: true } });
        if (og) entityName = og.name;
      }

      const actionText = status === "approved" ? "approved" : "rejected";
      const details = `${actorName} (${actorRole}) ${actionText} requirement "${reqName}" for Student ${studentId} (${studentName}).${reviewNotes ? ` Remarks: "${reviewNotes}"` : ""}`;

      await recordAuditLog({
        actorId: session?.user?.email || undefined,
        actorName,
        actorRole,
        action: status === "approved" ? "CLEAR_STUDENT" : "FLAG_DEFICIENCY",
        targetStudentId: studentId,
        targetStudentName: studentName,
        entityType,
        entityId: entityVal ? String(entityVal) : undefined,
        entityName,
        details,
      });

      // Dispatch Student In-App Notification & Alert
      await sendEvaluationResultAlert(
        studentId,
        reqName,
        status === "approved" ? "Approved" : "Rejected",
        reviewNotes || undefined,
        actorName
      );
    } catch (auditErr) {
      console.error("[Evaluate API] Failed to log audit/notification event:", auditErr);
    }

    return NextResponse.json({ ok: true, submission });
  } catch (err) {
    console.error("[POST /api/submissions/[submissionId]/evaluate]", err);
    return NextResponse.json({ error: "Evaluation failed" }, { status: 500 });
  }
}
