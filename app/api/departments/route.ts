/**
 * app/api/departments/route.ts
 * GET /api/departments — returns all departments from MySQL
 * POST /api/departments — creates a new department and assigns head user
 */
import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET() {
  try {
    const departments = await prisma.department.findMany({ orderBy: { name: "asc" } });
    return NextResponse.json(departments);
  } catch (err) {
    console.error("[GET /api/departments]", err);
    return NextResponse.json({ error: "Database error" }, { status: 500 });
  }
}

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const { name, abbreviation, head, email } = body;

    if (!name || !abbreviation || !head || !email) {
      return NextResponse.json({ error: "Name, abbreviation, head, and email are required." }, { status: 400 });
    }

    const abbreviationClean = abbreviation.trim().toUpperCase();
    const emailClean = email.trim().toLowerCase();

    // Check duplicate name or abbreviation
    const existingDept = await prisma.department.findFirst({
      where: {
        OR: [
          { name },
          { abbreviation: abbreviationClean }
        ]
      }
    });

    if (existingDept) {
      return NextResponse.json({ error: "Department with this name or abbreviation already exists." }, { status: 400 });
    }

    // Role Collision Safeguard
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
      if (existingUser.departmentId) {
        return NextResponse.json({ error: `The email ${emailClean} is already assigned as head of a department.` }, { status: 400 });
      }
      if (existingUser.orgId) {
        return NextResponse.json({ error: `The email ${emailClean} is already assigned as adviser of an organization.` }, { status: 400 });
      }
    }

    const newDept = await prisma.department.create({
      data: {
        name,
        abbreviation: abbreviationClean,
        head,
        email: emailClean,
      }
    });

    // Auto-create or promote user to Department Head role
    if (existingUser) {
      await prisma.user.update({
        where: { id: existingUser.id },
        data: {
          role: "department",
          departmentId: newDept.id,
          displayName: head || existingUser.displayName,
          studentId: null,
        }
      });
    } else {
      await prisma.user.create({
        data: {
          email: emailClean,
          displayName: head,
          role: "department",
          departmentId: newDept.id,
        }
      });
    }

    return NextResponse.json(newDept, { status: 201 });
  } catch (err: any) {
    console.error("[POST /api/departments]", err);
    return NextResponse.json({ error: err.message || "Failed to create department" }, { status: 500 });
  }
}
