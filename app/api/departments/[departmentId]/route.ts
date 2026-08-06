import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

/**
 * GET handler to fetch a single department by ID
 */
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ departmentId: string }> }
) {
  try {
    const { departmentId } = await params;
    const id = parseInt(departmentId, 10);
    
    if (isNaN(id)) {
      return NextResponse.json({ error: "Invalid department ID" }, { status: 400 });
    }

    const department = await prisma.department.findUnique({
      where: { id },
    });

    if (!department) {
      return NextResponse.json({ error: "Department not found" }, { status: 404 });
    }

    return NextResponse.json(department);
  } catch (err) {
    console.error("GET /api/departments/[departmentId] error:", err);
    return NextResponse.json({ error: "Failed to fetch department" }, { status: 500 });
  }
}

/**
 * PATCH handler to update department fields with role promotion hooks
 */
export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ departmentId: string }> }
) {
  try {
    const { departmentId } = await params;
    const id = parseInt(departmentId, 10);
    
    if (isNaN(id)) {
      return NextResponse.json({ error: "Invalid department ID" }, { status: 400 });
    }

    const currentDept = await prisma.department.findUnique({
      where: { id }
    });

    if (!currentDept) {
      return NextResponse.json({ error: "Department not found." }, { status: 404 });
    }

    const body = await request.json();
    const { logoUrl, coverUrl, themeColor, name, abbreviation, head, email } = body;
    
    const updateData: any = {};
    if (logoUrl !== undefined) updateData.logoUrl = logoUrl;
    if (coverUrl !== undefined) updateData.coverUrl = coverUrl;
    if (themeColor !== undefined) updateData.themeColor = themeColor;
    if (name !== undefined) updateData.name = name;
    if (abbreviation !== undefined) updateData.abbreviation = abbreviation.trim().toUpperCase();

    let headName = typeof head === "string" ? head : "";
    let headEmail = typeof email === "string" ? email : "";
    
    if (headEmail) {
      const emailClean = headEmail.trim().toLowerCase();

      // Check role collision
      const existingUser = await prisma.user.findUnique({
        where: { email: emailClean }
      });

      if (existingUser) {
        if (existingUser.role === "admin") {
          return NextResponse.json({ error: `The email ${emailClean} is already registered as a System Administrator.` }, { status: 400 });
        }
        if (existingUser.role === "student" || existingUser.studentId) {
          return NextResponse.json({ error: `The email ${emailClean} is already registered as a student account.` }, { status: 400 });
        }
        if (existingUser.officeId) {
          return NextResponse.json({ error: `The email ${emailClean} is already assigned as head/staff of an office.` }, { status: 400 });
        }
        if (existingUser.departmentId && existingUser.departmentId !== id) {
          return NextResponse.json({ error: `The email ${emailClean} is already assigned as head of another department.` }, { status: 400 });
        }
        if (existingUser.orgId) {
          return NextResponse.json({ error: `The email ${emailClean} is already assigned as adviser of an organization.` }, { status: 400 });
        }
      }

      // Safe update user records:
      // 1. Unlink the old head user if the email is changing
      if (currentDept.email && currentDept.email.toLowerCase() !== emailClean) {
        await prisma.user.updateMany({
          where: { email: currentDept.email.toLowerCase(), departmentId: id },
          data: { departmentId: null }
        });
      }

      // 2. Link/promote the new head user
      if (existingUser) {
        await prisma.user.update({
          where: { id: existingUser.id },
          data: {
            role: "department",
            departmentId: id,
            displayName: headName || existingUser.displayName,
            studentId: null,
          }
        });
      } else {
        await prisma.user.create({
          data: {
            email: emailClean,
            displayName: headName || "Department Head",
            role: "department",
            departmentId: id,
          }
        });
      }

      updateData.head = headName || currentDept.head;
      updateData.email = emailClean;
    } else {
      if (headName && headName !== currentDept.head) {
        updateData.head = headName;
        // Just update display name for the current head user
        if (currentDept.email) {
          await prisma.user.updateMany({
            where: { email: currentDept.email.toLowerCase(), departmentId: id },
            data: { displayName: headName }
          });
        }
      }
    }

    const updated = await prisma.department.update({
      where: { id },
      data: updateData,
    });
    
    return NextResponse.json(updated);
  } catch (err) {
    console.error("PATCH /api/departments/[departmentId] error:", err);
    return NextResponse.json({ error: "Failed to update department" }, { status: 500 });
  }
}

/**
 * DELETE handler to delete a department and clean up associations
 */
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ departmentId: string }> }
) {
  try {
    const { departmentId } = await params;
    const id = parseInt(departmentId, 10);

    if (isNaN(id)) {
      return NextResponse.json({ error: "Invalid department ID" }, { status: 400 });
    }

    // Clean up related records in a transaction to prevent constraint violations
    await prisma.$transaction([
      // 1. Delete associated department requirements
      prisma.departmentRequirement.deleteMany({
        where: { departmentId: id }
      }),
      // 2. Delete associated clearance records
      prisma.clearanceRecord.deleteMany({
        where: { departmentId: id }
      }),
      // 3. Delete associated flow steps
      prisma.flowStep.deleteMany({
        where: { departmentId: id }
      }),
      // 4. Set departmentId to null for linked users
      prisma.user.updateMany({
        where: { departmentId: id },
        data: { departmentId: null }
      }),
      // 5. Delete the department
      prisma.department.delete({
        where: { id }
      })
    ]);

    return NextResponse.json({ success: true });
  } catch (err: any) {
    console.error("DELETE /api/departments/[departmentId] error:", err);
    return NextResponse.json({ error: err.message || "Failed to delete department" }, { status: 500 });
  }
}
