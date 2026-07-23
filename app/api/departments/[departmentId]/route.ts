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
 * PATCH handler to update department fields
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

    const body = await request.json();
    const { logoUrl, name, abbreviation, head, email } = body;
    
    const updateData: any = {};
    if (logoUrl !== undefined) updateData.logoUrl = logoUrl;
    if (name !== undefined) updateData.name = name;
    if (abbreviation !== undefined) updateData.abbreviation = abbreviation;
    if (head !== undefined) updateData.head = head;
    if (email !== undefined) updateData.email = email;

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
