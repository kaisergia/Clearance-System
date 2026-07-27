/**
 * app/api/users/[id]/route.ts
 * PUT /api/users/[id] — update user details
 * DELETE /api/users/[id] — delete user
 */
import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function PUT(req: Request, context: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await context.params;
    const body = await req.json();
    const { displayName, email, role, departmentName, program, year, status } = body;

    // Check if ID is numeric User ID or synthetic student ID
    const userIdNum = parseInt(id, 10);

    if (!isNaN(userIdNum)) {
      const updatedUser = await prisma.user.update({
        where: { id: userIdNum },
        data: {
          displayName,
          email,
          role,
        },
        include: {
          student: true,
          department: true,
          office: true,
          org: true,
        },
      });

      // Also update linked student if applicable
      if (updatedUser.studentId) {
        await prisma.student.update({
          where: { id: updatedUser.studentId },
          data: {
            name: displayName,
            email: email,
            ...(departmentName ? { department: departmentName } : {}),
            ...(program ? { program } : {}),
            ...(year ? { year } : {}),
            ...(status ? { status } : {}),
          },
        });
      }

      return NextResponse.json(updatedUser);
    } else {
      // Synthetic student ID e.g. "student-2021-0492" or "2021-0492"
      const cleanStudentId = id.replace(/^student-/, "");
      const updatedStudent = await prisma.student.update({
        where: { id: cleanStudentId },
        data: {
          name: displayName,
          email: email,
          ...(departmentName ? { department: departmentName } : {}),
          ...(program ? { program } : {}),
          ...(year ? { year } : {}),
          ...(status ? { status } : {}),
        },
      });
      return NextResponse.json(updatedStudent);
    }
  } catch (err: any) {
    console.error("[PUT /api/users/[id]]", err);
    return NextResponse.json({ error: err.message || "Failed to update user" }, { status: 500 });
  }
}

export async function DELETE(req: Request, context: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await context.params;
    const userIdNum = parseInt(id, 10);

    if (!isNaN(userIdNum)) {
      await prisma.user.delete({ where: { id: userIdNum } });
    } else {
      const cleanStudentId = id.replace(/^student-/, "");
      await prisma.student.delete({ where: { id: cleanStudentId } });
    }

    return NextResponse.json({ success: true });
  } catch (err: any) {
    console.error("[DELETE /api/users/[id]]", err);
    return NextResponse.json({ error: err.message || "Failed to delete user" }, { status: 500 });
  }
}
