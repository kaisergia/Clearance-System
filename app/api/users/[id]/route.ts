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

    // Role Normalization (e.g. office_staff -> head_office, org_adviser -> org)
    let normalizedRole = role;
    if (role === "office_staff") normalizedRole = "head_office";
    if (role === "org_adviser") normalizedRole = "org";

    let parsedOfficeId = officeId ? parseInt(String(officeId), 10) : null;
    let parsedDeptId = departmentId ? parseInt(String(departmentId), 10) : null;
    let parsedOrgId = orgId ? parseInt(String(orgId), 10) : null;

    if (!parsedOfficeId && normalizedRole === "head_office" && departmentName) {
      const office = await prisma.office.findFirst({ where: { name: departmentName } });
      if (office) parsedOfficeId = office.id;
    }
    if (!parsedDeptId && normalizedRole === "department" && departmentName) {
      const dept = await prisma.department.findFirst({ where: { OR: [{ name: departmentName }, { abbreviation: departmentName }] } });
      if (dept) parsedDeptId = dept.id;
    }
    if (!parsedOrgId && normalizedRole === "org" && departmentName) {
      const org = await prisma.org.findFirst({ where: { name: departmentName } });
      if (org) parsedOrgId = org.id;
    }

    if (!isNaN(userIdNum)) {
      const updatedUser = await prisma.user.update({
        where: { id: userIdNum },
        data: {
          ...(displayName ? { displayName } : {}),
          ...(email ? { email } : {}),
          ...(normalizedRole ? { role: normalizedRole } : {}),
          officeId: normalizedRole === "head_office" ? parsedOfficeId : normalizedRole === "admin" ? null : parsedOfficeId,
          departmentId: normalizedRole === "department" ? parsedDeptId : normalizedRole === "admin" ? null : parsedDeptId,
          orgId: normalizedRole === "org" ? parsedOrgId : normalizedRole === "admin" ? null : parsedOrgId,
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
            ...(normalizedRole ? { role: normalizedRole } : {}),
            officeId: normalizedRole === "head_office" ? parsedOfficeId : null,
            departmentId: normalizedRole === "department" ? parsedDeptId : null,
            orgId: normalizedRole === "org" ? parsedOrgId : null,
          },
        });
      } else if (normalizedRole && normalizedRole !== "student") {
        // Create user account if upgraded to staff/admin
        await prisma.user.create({
          data: {
            email: updatedStudent.email,
            displayName: updatedStudent.name,
            role: normalizedRole,
            studentId: cleanStudentId,
            officeId: normalizedRole === "head_office" ? parsedOfficeId : null,
            departmentId: normalizedRole === "department" ? parsedDeptId : null,
            orgId: normalizedRole === "org" ? parsedOrgId : null,
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
