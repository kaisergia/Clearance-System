/**
 * app/api/users/[id]/route.ts
 * PUT /api/users/[id] — update user details, roles, and office/dept/org scoping
 * DELETE /api/users/[id] — delete user
 */
import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function PUT(req: Request, context: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await context.params;
    const body = await req.json();
    const { displayName, email, role, officeId, departmentId, orgId, departmentName, program, year, status } = body;

    // Check if ID is numeric User ID or synthetic student ID
    const userIdNum = parseInt(id, 10);

    const parsedOfficeId = officeId ? parseInt(String(officeId), 10) : null;
    const parsedDeptId = departmentId ? parseInt(String(departmentId), 10) : null;
    const parsedOrgId = orgId ? parseInt(String(orgId), 10) : null;

    if (!isNaN(userIdNum)) {
      const updatedUser = await prisma.user.update({
        where: { id: userIdNum },
        data: {
          ...(displayName ? { displayName } : {}),
          ...(email ? { email } : {}),
          ...(role ? { role } : {}),
          officeId: role === "head_office" ? parsedOfficeId : role === "admin" ? null : parsedOfficeId,
          departmentId: role === "department" ? parsedDeptId : role === "admin" ? null : parsedDeptId,
          orgId: role === "org" ? parsedOrgId : role === "admin" ? null : parsedOrgId,
        },
        include: {
          student: true,
          department: true,
          office: true,
          org: true,
        },
      });

      // Also update linked student record if applicable
      if (updatedUser.studentId) {
        await prisma.student.update({
          where: { id: updatedUser.studentId },
          data: {
            ...(displayName ? { name: displayName } : {}),
            ...(email ? { email } : {}),
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
          ...(displayName ? { name: displayName } : {}),
          ...(email ? { email } : {}),
          ...(departmentName ? { department: departmentName } : {}),
          ...(program ? { program } : {}),
          ...(year ? { year } : {}),
          ...(status ? { status } : {}),
        },
      });

      // Find if there's a User account tied to this student and update role
      const linkedUser = await prisma.user.findFirst({
        where: { OR: [{ studentId: cleanStudentId }, { email: updatedStudent.email }] },
      });

      if (linkedUser) {
        await prisma.user.update({
          where: { id: linkedUser.id },
          data: {
            ...(displayName ? { displayName } : {}),
            ...(email ? { email } : {}),
            ...(role ? { role } : {}),
            officeId: role === "head_office" ? parsedOfficeId : null,
            departmentId: role === "department" ? parsedDeptId : null,
            orgId: role === "org" ? parsedOrgId : null,
          },
        });
      } else if (role && role !== "student") {
        // Create user account if upgraded to staff/admin
        await prisma.user.create({
          data: {
            email: updatedStudent.email,
            displayName: updatedStudent.name,
            role: role,
            studentId: cleanStudentId,
            officeId: role === "head_office" ? parsedOfficeId : null,
            departmentId: role === "department" ? parsedDeptId : null,
            orgId: role === "org" ? parsedOrgId : null,
          },
        });
      }

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
