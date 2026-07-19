/**
 * app/api/submissions/[submissionId]/evaluate/route.ts
 *
 * POST /api/submissions/[submissionId]/evaluate
 * Evaluates a student's requirement submission (approve or reject).
 */
import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

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

    // 1. Update the submission record
    const submission = await prisma.requirementSubmission.update({
      where: { id: submissionId },
      data: {
        status,
        reviewedBy,
        reviewNotes: status === "rejected" ? reviewNotes : null,
      },
    });

    const { studentId, requirementId } = submission;

    // 2. Identify the owner entity of the requirement
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
      // Find the corresponding ClearanceRecord
      const clearanceRecord = await prisma.clearanceRecord.findFirst({
        where: {
          studentId,
          ...(officeId && { officeId }),
          ...(departmentId && { departmentId }),
          ...(orgId && { orgId }),
        },
      });

      if (clearanceRecord) {
        if (status === "rejected") {
          // If rejected, set overall clearance status to "Rejected" and save remarks
          await prisma.clearanceRecord.update({
            where: { id: clearanceRecord.id },
            data: {
              status: "Rejected",
              remarks: reviewNotes || "Requirement was rejected.",
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
                appliesTo.includes(student.program) ||
                appliesTo.includes(student.department) ||
                appliesTo.includes(student.year)
              );
            };

            // Get all requirements for this specific entity
            let allEntityReqs: any[] = [];
            if (officeId) {
              allEntityReqs = await prisma.officeRequirement.findMany({ where: { officeId, status: "Live" } });
            } else if (departmentId) {
              allEntityReqs = await prisma.departmentRequirement.findMany({ where: { departmentId, status: "Live" } });
            } else if (orgId) {
              allEntityReqs = await prisma.orgRequirement.findMany({ where: { orgId, status: "Live" } });
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

            // Trigger sync of overall student status
            const allRecords = await prisma.clearanceRecord.findMany({ where: { studentId } });
            const overallCleared = allRecords.length > 0 && allRecords.every(r => r.status === "Cleared");
            await prisma.student.update({
              where: { id: studentId },
              data: { status: overallCleared ? "Cleared" : "Pending" }
            });
          }
        }
      }
    }

    return NextResponse.json({ ok: true, submission });
  } catch (err) {
    console.error("[POST /api/submissions/[submissionId]/evaluate]", err);
    return NextResponse.json({ error: "Evaluation failed" }, { status: 500 });
  }
}
