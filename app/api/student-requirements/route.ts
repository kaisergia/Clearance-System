/**
 * app/api/student-requirements/route.ts
 *
 * GET /api/student-requirements?studentId=xxx
 * Retrieves the clearance requirements for a specific student, grouped by entity (office, department, org),
 * merged with their clearance records and requirement submissions.
 */
import { NextRequest, NextResponse } from "next/server";
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

    // 1. Get all offices and their requirements
    const offices = await prisma.office.findMany({
      include: {
        requirements: {
          where: { status: "Live" },
        },
      },
    });

    const officeRecords = await prisma.clearanceRecord.findMany({
      where: { studentId, officeId: { not: null } },
    });

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

      return {
        id: o.id,
        name: "Office Clearance",
        responsible: o.name,
        type: "office" as const,
        status: clearance?.status || "Pending",
        dateCleared: clearance?.dateCleared || null,
        remarks: clearance?.remarks || "",
        tasks: applicableRequirements,
      };
    });

    // 2. Get applicable orgs and their requirements
    const orgs = await prisma.org.findMany({
      where: { status: "Active" },
      include: {
        requirements: {
          where: { status: "Live" },
        },
      },
    });

    // Check student's specific memberships
    const memberships = await prisma.orgMember.findMany({
      where: { studentId },
    });
    const memberOrgIds = new Set(memberships.map((m) => m.orgId));
    const studentProgCode = PROGRAM_MAP[student.program] || student.program;

    const applicableOrgs = orgs.filter((org) => {
      // 1. Student Government applies to all students
      if (org.type === "Gov") return true;

      // 2. Department LGU applies to students in that department
      if (org.type === "LGU" && org.department === student.department) return true;

      // 3. Academic Club applies to students matching department or program
      if (org.type === "AcademicClub") {
        if (org.department && org.department === student.department) return true;
        if (org.program && (org.program === studentProgCode || org.program === student.program)) return true;
      }

      // 4. Non-Academic / Interest Clubs apply if student is explicitly enrolled
      if (memberOrgIds.has(org.id)) return true;

      return false;
    });

    const orgRecords = await prisma.clearanceRecord.findMany({
      where: { studentId, orgId: { not: null } },
    });

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

      return {
        id: org.id,
        name: "Org Membership Clearance",
        responsible: org.name,
        type: "org" as const,
        status: clearance?.status || "Pending",
        dateCleared: clearance?.dateCleared || null,
        remarks: clearance?.remarks || "",
        tasks: applicableRequirements,
      };
    });

    // 3. Get student's department clearance
    const department = await prisma.department.findFirst({
      where: { abbreviation: student.department },
      include: {
        requirements: {
          where: { status: "Live" },
        },
      },
    });

    const deptRecords = await prisma.clearanceRecord.findMany({
      where: { studentId, departmentId: { not: null } },
    });

    const deptData = department
      ? [
          (() => {
            const clearance = deptRecords.find((r) => r.departmentId === department.id);
            const applicableRequirements = department.requirements.filter(isApplicable).map((req) => {
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

            return {
              id: department.id,
              name: "Department Clearance",
              responsible: department.name,
              type: "department" as const,
              status: clearance?.status || "Pending",
              dateCleared: clearance?.dateCleared || null,
              remarks: clearance?.remarks || "",
              tasks: applicableRequirements,
            };
          })(),
        ]
      : [];

    const combined = [...officeData, ...orgData, ...deptData];
    return NextResponse.json(combined);
  } catch (err) {
    console.error("[GET /api/student-requirements]", err);
    return NextResponse.json({ error: "Database error" }, { status: 500 });
  }
}
