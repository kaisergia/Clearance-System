import { prisma } from "@/lib/prisma";

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

export async function checkPrerequisites(
  studentId: string,
  termId: number,
  type: "office" | "org" | "department",
  entityId: number
): Promise<{ allowed: boolean; error?: string }> {
  const student = await prisma.student.findUnique({ where: { id: studentId } });
  if (!student) {
    return { allowed: true };
  }

  const flows = await prisma.clearanceFlow.findMany({
    where: { termId, status: "Published" },
    include: {
      steps: {
        include: {
          prerequisites: {
            include: {
              prerequisiteStep: true,
            },
          },
        },
      },
    },
  });

  // Find matching flow based on target criteria
  let matchedFlow = null;
  for (const flow of flows) {
    let criteria: any = {};
    try {
      if (typeof flow.targetCriteria === "string") {
        criteria = JSON.parse(flow.targetCriteria);
      } else if (flow.targetCriteria && typeof flow.targetCriteria === "object") {
        criteria = flow.targetCriteria;
      }
    } catch {}

    const matchYear = !criteria.years || criteria.years.length === 0 || criteria.years.includes(student.year);
    const matchDept = !criteria.departments || criteria.departments.length === 0 || criteria.departments.includes(student.department);

    if (matchYear && matchDept) {
      matchedFlow = flow;
      break;
    }
  }

  if (!matchedFlow) {
    return { allowed: true };
  }

  // Find the step for this signatory
  const step = matchedFlow.steps.find((s) => {
    if (type === "office" && s.officeId === entityId) return true;
    if (type === "department" && (s.departmentId === entityId || s.isDynamicDept)) return true;
    if (type === "org" && (s.orgId === entityId || s.isDynamicOrgs)) return true;
    return false;
  });

  if (!step || step.prerequisites.length === 0) {
    return { allowed: true };
  }

  const pendingPrereqs: string[] = [];

  for (const p of step.prerequisites) {
    const prereq = p.prerequisiteStep;
    let isPrereqCleared = false;

    if (prereq.officeId) {
      const r = await prisma.clearanceRecord.findFirst({
        where: { studentId, termId, officeId: prereq.officeId },
      });
      if (r && r.status === "Cleared") isPrereqCleared = true;
    } else if (prereq.departmentId) {
      const r = await prisma.clearanceRecord.findFirst({
        where: { studentId, termId, departmentId: prereq.departmentId },
      });
      if (r && r.status === "Cleared") isPrereqCleared = true;
    } else if (prereq.orgId) {
      const r = await prisma.clearanceRecord.findFirst({
        where: { studentId, termId, orgId: prereq.orgId },
      });
      if (r && r.status === "Cleared") isPrereqCleared = true;
    } else if (prereq.isDynamicDept) {
      const dept = await prisma.department.findFirst({
        where: { abbreviation: student.department },
      });
      if (dept) {
        const r = await prisma.clearanceRecord.findFirst({
          where: { studentId, termId, departmentId: dept.id },
        });
        if (r && r.status === "Cleared") isPrereqCleared = true;
      } else {
        isPrereqCleared = true;
      }
    } else if (prereq.isDynamicOrgs) {
      const memberships = await prisma.orgMember.findMany({
        where: { studentId },
      });
      let allOrgsCleared = true;
      for (const m of memberships) {
        const r = await prisma.clearanceRecord.findFirst({
          where: { studentId, termId, orgId: m.orgId },
        });
        if (!r || r.status !== "Cleared") {
          allOrgsCleared = false;
          break;
        }
      }
      if (allOrgsCleared) isPrereqCleared = true;
    }

    if (!isPrereqCleared) {
      let prereqName = "Prerequisite Signatories";
      if (prereq.officeId) {
        const off = await prisma.office.findUnique({ where: { id: prereq.officeId } });
        if (off) prereqName = off.name;
      } else if (prereq.departmentId) {
        const d = await prisma.department.findUnique({ where: { id: prereq.departmentId } });
        if (d) prereqName = d.name;
      } else if (prereq.orgId) {
        const o = await prisma.org.findUnique({ where: { id: prereq.orgId } });
        if (o) prereqName = o.name;
      } else if (prereq.isDynamicDept) {
        prereqName = "Academic Department";
      } else if (prereq.isDynamicOrgs) {
        prereqName = "Student Organizations";
      }
      pendingPrereqs.push(prereqName);
    }
  }

  if (pendingPrereqs.length > 0) {
    const listStr = pendingPrereqs.map((name) => `'${name}'`).join(", ");
    return {
      allowed: false,
      error: `Cannot approve. The following prerequisite(s) must clear the student first: ${listStr}.`,
    };
  }

  return { allowed: true };
}
