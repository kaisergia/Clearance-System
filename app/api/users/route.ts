/**
 * app/api/users/route.ts
 * GET /api/users — returns all users from MySQL/PostgreSQL
 * POST /api/users — creates a new user
 */
import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET() {
  try {
    const users = await prisma.user.findMany({
      include: {
        student: true,
        department: true,
        office: true,
        org: true,
      },
      orderBy: { createdAt: "desc" },
    });

    // Also fetch any students that don't have a linked User record yet so all constituents appear
    const students = await prisma.student.findMany({
      orderBy: { name: "asc" },
    });

    const userStudentIds = new Set(users.filter((u) => u.studentId).map((u) => u.studentId));

    const unlinkedStudentUsers = students
      .filter((s) => !userStudentIds.has(s.id))
      .map((s) => ({
        id: `student-${s.id}`,
        email: s.email || `${s.id}@g.cjc.edu.ph`,
        displayName: s.name,
        role: "student",
        createdAt: new Date(),
        studentId: s.id,
        officeId: null,
        departmentId: null,
        orgId: null,
        student: s,
        department: null,
        office: null,
        org: null,
      }));

    return NextResponse.json([...users, ...unlinkedStudentUsers]);
  } catch (err) {
    console.error("[GET /api/users]", err);
    return NextResponse.json({ error: "Failed to fetch users" }, { status: 500 });
  }
}

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const { email, displayName, role, departmentName, program, year, studentId, officeId, departmentId, orgId } = body;

    if (!email || !displayName || !role) {
      return NextResponse.json({ error: "Email, Name, and Role are required." }, { status: 400 });
    }

    let finalStudentId = studentId || null;

    // If role is student, ensure Student record exists or is created
    if (role === "student") {
      if (!finalStudentId) {
        finalStudentId = `2026-${Math.floor(1000 + Math.random() * 9000)}`;
      }
      const existingStudent = await prisma.student.findUnique({ where: { id: finalStudentId } });
      if (!existingStudent) {
        await prisma.student.create({
          data: {
            id: finalStudentId,
            name: displayName,
            email: email,
            department: departmentName || "CCIS",
            program: program || "BSIT",
            year: year || "1st Year",
            semester: "1st Semester 2025-2026",
            status: "Pending",
          },
        });
      }
    }

    const newUser = await prisma.user.create({
      data: {
        email,
        displayName,
        role,
        studentId: finalStudentId,
        officeId: officeId ? Number(officeId) : null,
        departmentId: departmentId ? Number(departmentId) : null,
        orgId: orgId ? Number(orgId) : null,
      },
      include: {
        student: true,
        department: true,
        office: true,
        org: true,
      },
    });

    return NextResponse.json(newUser, { status: 201 });
  } catch (err: any) {
    console.error("[POST /api/users]", err);
    return NextResponse.json({ error: err.message || "Failed to create user" }, { status: 500 });
  }
}
