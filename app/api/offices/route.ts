/**
 * app/api/offices/route.ts
 * GET /api/offices — returns all offices with linked headUser profile & logoUrl
 */
import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET() {
  try {
    const offices = await prisma.office.findMany({
      include: {
        users: {
          select: {
            id: true,
            displayName: true,
            email: true,
            avatarUrl: true,
            role: true,
          },
        },
      },
      orderBy: { name: "asc" },
    });

    const formatted = offices.map((o) => {
      const headUser = o.users?.find((u) => u.role === "head_office") || o.users?.[0];
      return {
        ...o,
        headUser: headUser
          ? {
              name: headUser.displayName || o.head,
              email: headUser.email || o.email,
              avatarUrl: headUser.avatarUrl || null,
            }
          : {
              name: o.head,
              email: o.email,
              avatarUrl: null,
            },
      };
    });

    return NextResponse.json(formatted);
  } catch (err) {
    console.error("[GET /api/offices]", err);
    return NextResponse.json({ error: "Database error" }, { status: 500 });
  }
}

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const { name, head, email, description } = body;

    if (!name || !head || !email) {
      return NextResponse.json({ error: "Name, head name, and email are required." }, { status: 400 });
    }

    const existingOffice = await prisma.office.findFirst({
      where: { name }
    });

    if (existingOffice) {
      return NextResponse.json({ error: "Office with this name already exists." }, { status: 400 });
    }

    // Role Collision Safeguard
    const emailLower = email.trim().toLowerCase();
    const existingUser = await prisma.user.findUnique({
      where: { email: emailLower }
    });

    if (existingUser) {
      if (existingUser.role === "admin") {
        return NextResponse.json({ error: `The email ${emailLower} is already registered as a System Administrator.` }, { status: 400 });
      }
      if (existingUser.role === "student" || existingUser.studentId) {
        return NextResponse.json({ error: `The email ${emailLower} is already registered as a student account.` }, { status: 400 });
      }
      if (existingUser.officeId) {
        return NextResponse.json({ error: `The email ${emailLower} is already assigned as head/staff of another office.` }, { status: 400 });
      }
      if (existingUser.departmentId) {
        return NextResponse.json({ error: `The email ${emailLower} is already assigned as head of a department.` }, { status: 400 });
      }
      if (existingUser.orgId) {
        return NextResponse.json({ error: `The email ${emailLower} is already assigned as adviser of an organization.` }, { status: 400 });
      }
    }

    const newOffice = await prisma.office.create({
      data: {
        name,
        head,
        email: emailLower,
      }
    });

    // Auto-create or promote user to Head Office role
    if (existingUser) {
      // Promote existing student/user to head_office and link officeId
      await prisma.user.update({
        where: { id: existingUser.id },
        data: {
          role: "head_office",
          officeId: newOffice.id,
          displayName: head || existingUser.displayName,
          studentId: null, // Clear student association if they were promoted from student
        }
      });
    } else {
      // Create new user record
      await prisma.user.create({
        data: {
          email: emailLower,
          displayName: head,
          role: "head_office",
          officeId: newOffice.id,
        }
      });
    }

    return NextResponse.json(newOffice, { status: 201 });
  } catch (err: any) {
    console.error("[POST /api/offices]", err);
    return NextResponse.json({ error: err.message || "Failed to create office" }, { status: 500 });
  }
}
