/**
 * app/api/student-requirements/route.ts
 *
 * GET /api/student-requirements?studentId=xxx
 * Retrieves the clearance requirements for a specific student, grouped by entity (office, department, org),
 * merged with their clearance records and requirement submissions.
 */
import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { ensureRequirementsForTerm } from "@/lib/requirementCloner";

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

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const studentId = searchParams.get("studentId");
    if (!studentId) {
      return NextResponse.json({ error: "studentId is required" }, { status: 400 });
    }

    const student = await prisma.student.findUnique({
      where: { id: studentId },
    });

    if (!student) {
      return NextResponse.json({ error: "Student not found" }, { status: 404 });
    }

    // Helper function to check if a requirement applies to the student
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

    // Load all submissions for this student to merge later
    const submissions = await prisma.requirementSubmission.findMany({
      where: { studentId },
    });

    // Find the active academic term
    const activeTerm = await prisma.academicTerm.findFirst({
      where: { status: "Active" },
    });

    // Find the published clearance flows for this term
    const activeFlows = activeTerm
      ? await prisma.clearanceFlow.findMany({
          where: { termId: activeTerm.id, status: "Published" },
          include: {
            steps: {
              include: {
                prerequisites: true,
              },
              orderBy: { sequenceOrder: "asc" },
            },
          },
        })
      : [];

    // Filter flows that apply to this student based on targetCriteria
    const applicableFlows = activeFlows.filter((flow) => {
      let criteria: any = {};
      try {
        if (typeof flow.targetCriteria === "string") {
          criteria = JSON.parse(flow.targetCriteria);
        } else if (flow.targetCriteria && typeof flow.targetCriteria === "object") {
          criteria = flow.targetCriteria;
        }
      } catch (e) {
        console.error("Error parsing target criteria", e);
      }

      const years = criteria.years || [];
      const depts = criteria.departments || [];
      const matchYear = years.length === 0 || years.includes(student.year);
      const matchDept = depts.length === 0 || depts.includes(student.department);
      return matchYear && matchDept;
    });

    // Resolve signatories from applicable clearance flows
    const resolvedOffices: Set<number> = new Set();
    const resolvedDepartments: Set<number> = new Set();
    const resolvedOrgs: Set<number> = new Set();

    // Check student's specific memberships
    const memberships = await prisma.orgMember.findMany({
      where: { studentId },
    });
    const memberOrgIds = memberships.map((m) => m.orgId);

    // Get student's department object to resolve isDynamicDept
    const studentDeptObj = await prisma.department.findFirst({
      where: { abbreviation: student.department },
    });

    const getPrerequisitesForSignatory = (type: "office" | "department" | "org", id: number) => {
      const prers: { type: "office" | "department" | "org"; id: number }[] = [];
      for (const flow of applicableFlows) {
        for (const step of flow.steps) {
          const isMatch =
            (type === "office" && step.officeId === id) ||
            (type === "department" && (step.departmentId === id || (step.isDynamicDept && studentDeptObj?.id === id))) ||
            (type === "org" && (step.orgId === id || (step.isDynamicOrgs && memberOrgIds.includes(id))));

          if (isMatch) {
            for (const prereqRelation of step.prerequisites) {
              const prereqStep = flow.steps.find((s) => s.id === prereqRelation.prerequisiteStepId);
              if (prereqStep) {
                if (prereqStep.officeId) {
                  prers.push({ type: "office", id: prereqStep.officeId });
                } else if (prereqStep.departmentId) {
                  prers.push({ type: "department", id: prereqStep.departmentId });
                } else if (prereqStep.orgId) {
                  prers.push({ type: "org", id: prereqStep.orgId });
                } else if (prereqStep.isDynamicDept && studentDeptObj) {
                  prers.push({ type: "department", id: studentDeptObj.id });
                } else if (prereqStep.isDynamicOrgs) {
                  for (const orgId of memberOrgIds) {
                    prers.push({ type: "org", id: orgId });
                  }
                }
              }
            }
          }
        }
      }
      return prers;
    };

    for (const flow of applicableFlows) {
      for (const step of flow.steps) {
        if (step.officeId) {
          resolvedOffices.add(step.officeId);
        } else if (step.departmentId) {
          resolvedDepartments.add(step.departmentId);
        } else if (step.orgId) {
          resolvedOrgs.add(step.orgId);
        } else if (step.isDynamicDept && studentDeptObj) {
          resolvedDepartments.add(studentDeptObj.id);
        } else if (step.isDynamicOrgs) {
          for (const orgId of memberOrgIds) {
            resolvedOrgs.add(orgId);
          }
        }
      }
    }

    // Ensure all resolved signatories have their requirements copied to the active term if not already done
    if (activeTerm) {
      await ensureRequirementsForTerm(
        activeTerm.id,
        Array.from(resolvedOffices),
        Array.from(resolvedDepartments),
        Array.from(resolvedOrgs)
      );
    }

    // 1. Get resolved offices and their requirements for this term
    const offices = resolvedOffices.size > 0
      ? await prisma.office.findMany({
          where: { id: { in: Array.from(resolvedOffices) } },
          include: {
            requirements: {
              where: { status: "Live", termId: activeTerm?.id || undefined },
            },
          },
        })
      : [];

    const officeRecords = activeTerm
      ? await prisma.clearanceRecord.findMany({
          where: { studentId, termId: activeTerm.id, officeId: { not: null } },
        })
      : [];

    const officeData = offices.map((o) => {
      const clearance = officeRecords.find((r) => r.officeId === o.id);
      const applicableRequirements = o.requirements.filter(isApplicable).map((req) => {
        const sub = submissions.find((s) => s.requirementId === req.id);
        return {
          id: req.id,
          name: req.name,
          description: req.description || "",
          linkName: req.linkName || null,
          linkUrl: req.linkUrl || null,
          type: req.type,
          surveyQuestions: req.surveyQuestions,
          acknowledgmentText: req.acknowledgmentText,
          deadline: req.deadline || null,
          submission: sub || null,
        };
      });

      const hasReqs = applicableRequirements.length > 0;
      return {
        id: o.id,
        name: "Office Clearance",
        responsible: o.name,
        type: "office" as const,
        status: clearance ? clearance.status : "Pending",
        dateCleared: clearance ? clearance.dateCleared : null,
        remarks: clearance?.remarks || "",
        tasks: applicableRequirements,
        prerequisiteSignatories: getPrerequisitesForSignatory("office", o.id),
      };
    });

    // 2. Get resolved applicable orgs and their requirements for this term
    const applicableOrgs = resolvedOrgs.size > 0
      ? await prisma.org.findMany({
          where: { id: { in: Array.from(resolvedOrgs) }, status: "Active" },
          include: {
            requirements: {
              where: { status: "Live", termId: activeTerm?.id || undefined },
            },
          },
        })
      : [];

    const orgRecords = activeTerm
      ? await prisma.clearanceRecord.findMany({
          where: { studentId, termId: activeTerm.id, orgId: { not: null } },
        })
      : [];

    const orgData = applicableOrgs.map((org) => {
      const clearance = orgRecords.find((r) => r.orgId === org.id);
      const applicableRequirements = org.requirements.filter(isApplicable).map((req) => {
        const sub = submissions.find((s) => s.requirementId === req.id);
        return {
          id: req.id,
          name: req.name,
          description: req.description || "",
          linkName: req.linkName || null,
          linkUrl: req.linkUrl || null,
          type: req.type,
          surveyQuestions: req.surveyQuestions,
          acknowledgmentText: req.acknowledgmentText,
          deadline: req.deadline || null,
          submission: sub || null,
        };
      });

      let displayName = "Organization Clearance";
      if (org.type === "LGU") {
        displayName = "LGU Clearance";
      } else if (org.type === "Gov") {
        displayName = "Student Government Clearance";
      } else if (org.type === "AcademicClub" || org.type === "NonAcademicClub") {
        displayName = "Club Clearance";
      }

      const hasReqs = applicableRequirements.length > 0;
      return {
        id: org.id,
        name: displayName,
        responsible: org.name,
        type: "org" as const,
        status: clearance ? clearance.status : "Pending",
        dateCleared: clearance ? clearance.dateCleared : null,
        remarks: clearance?.remarks || "",
        tasks: applicableRequirements,
        prerequisiteSignatories: getPrerequisitesForSignatory("org", org.id),
      };
    });

    // 3. Get resolved department clearance and requirements for this term
    const deptList = resolvedDepartments.size > 0
      ? await prisma.department.findMany({
          where: { id: { in: Array.from(resolvedDepartments) } },
          include: {
            requirements: {
              where: { status: "Live", termId: activeTerm?.id || undefined },
            },
          },
        })
      : [];

    const deptRecords = activeTerm
      ? await prisma.clearanceRecord.findMany({
          where: { studentId, termId: activeTerm.id, departmentId: { not: null } },
        })
      : [];

    const deptData = deptList.map((dept) => {
      const clearance = deptRecords.find((r) => r.departmentId === dept.id);
      const applicableRequirements = dept.requirements.filter(isApplicable).map((req) => {
        const sub = submissions.find((s) => s.requirementId === req.id);
        return {
          id: req.id,
          name: req.name,
          description: req.description || "",
          linkName: req.linkName || null,
          linkUrl: req.linkUrl || null,
          type: req.type,
          surveyQuestions: req.surveyQuestions,
          acknowledgmentText: req.acknowledgmentText,
          deadline: req.deadline || null,
          submission: sub || null,
        };
      });

      const hasReqs = applicableRequirements.length > 0;
      return {
        id: dept.id,
        name: "Department Clearance",
        responsible: dept.name,
        type: "department" as const,
        status: clearance ? clearance.status : "Pending",
        dateCleared: clearance ? clearance.dateCleared : null,
        remarks: clearance?.remarks || "",
        tasks: applicableRequirements,
        prerequisiteSignatories: getPrerequisitesForSignatory("department", dept.id),
      };
    });

    const combined = [...officeData, ...orgData, ...deptData];

    // Sort combined signatories by the sequence order in applicable flows
    const getSequenceOrder = (item: any) => {
      for (const flow of applicableFlows) {
        for (const step of flow.steps) {
          if (item.type === "office" && step.officeId === item.id) {
            return step.sequenceOrder;
          }
          if (item.type === "department" && (step.departmentId === item.id || (step.isDynamicDept && studentDeptObj && studentDeptObj.id === item.id))) {
            return step.sequenceOrder;
          }
          if (item.type === "org" && (step.orgId === item.id || (step.isDynamicOrgs && memberOrgIds.includes(item.id)))) {
            return step.sequenceOrder;
          }
        }
      }
      return 999; // Fallback for any unmatched steps
    };

    combined.sort((a, b) => {
      const seqA = getSequenceOrder(a);
      const seqB = getSequenceOrder(b);
      if (seqA !== seqB) {
        return seqA - seqB;
      }

      // If they share the same sequence order, check if one is a prerequisite of the other
      const isAPrereqOfB = (b.prerequisiteSignatories || []).some(
        (p: any) => p.type === a.type && p.id === a.id
      );
      if (isAPrereqOfB) return -1;

      const isBPrereqOfA = (a.prerequisiteSignatories || []).some(
        (p: any) => p.type === b.type && p.id === b.id
      );
      if (isBPrereqOfA) return 1;

      return 0;
    });

    return NextResponse.json(combined);
  } catch (err) {
    console.error("[GET /api/student-requirements]", err);
    return NextResponse.json({ error: "Database error" }, { status: 500 });
  }
}
