import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

/**
 * GET handler to fetch a single office by ID
 */
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ officeId: string }> }
) {
  try {
    const { officeId } = await params;
    const id = parseInt(officeId, 10);
    
    if (isNaN(id)) {
      return NextResponse.json({ error: "Invalid office ID" }, { status: 400 });
    }

    const office = await prisma.office.findUnique({
      where: { id },
    });

    if (!office) {
      return NextResponse.json({ error: "Office not found" }, { status: 404 });
    }

    return NextResponse.json(office);
  } catch (err) {
    console.error("GET /api/offices/[officeId] error:", err);
    return NextResponse.json({ error: "Failed to fetch office" }, { status: 500 });
  }
}

/**
 * PATCH handler to update office fields
 */
export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ officeId: string }> }
) {
  try {
    const { officeId } = await params;
    const id = parseInt(officeId, 10);
    
    if (isNaN(id)) {
      return NextResponse.json({ error: "Invalid office ID" }, { status: 400 });
    }

    const body = await request.json();
    const { logoUrl, coverUrl, themeColor, name, head, email } = body;
    
    const updateData: any = {};
    if (logoUrl !== undefined) updateData.logoUrl = logoUrl;
    if (coverUrl !== undefined) updateData.coverUrl = coverUrl;
    if (themeColor !== undefined) updateData.themeColor = themeColor;
    if (name !== undefined) updateData.name = name;
    if (head !== undefined) updateData.head = head;
    if (email !== undefined) updateData.email = email;

    const updated = await prisma.office.update({
      where: { id },
      data: updateData,
    });
    
    return NextResponse.json(updated);
  } catch (err) {
    console.error("PATCH /api/offices/[officeId] error:", err);
    return NextResponse.json({ error: "Failed to update office" }, { status: 500 });
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ officeId: string }> }
) {
  try {
    const { officeId } = await params;
    const id = parseInt(officeId, 10);

    if (isNaN(id)) {
      return NextResponse.json({ error: "Invalid office ID" }, { status: 400 });
    }

    // Clean up related records in a transaction to prevent constraint violations
    await prisma.$transaction([
      // 1. Delete associated office requirements
      prisma.officeRequirement.deleteMany({
        where: { officeId: id }
      }),
      // 2. Delete associated clearance records
      prisma.clearanceRecord.deleteMany({
        where: { officeId: id }
      }),
      // 3. Delete associated flow steps
      prisma.flowStep.deleteMany({
        where: { officeId: id }
      }),
      // 4. Set officeId to null for linked users
      prisma.user.updateMany({
        where: { officeId: id },
        data: { officeId: null }
      }),
      // 5. Delete the office
      prisma.office.delete({
        where: { id }
      })
    ]);

    return NextResponse.json({ success: true });
  } catch (err: any) {
    console.error("DELETE /api/offices/[officeId] error:", err);
    return NextResponse.json({ error: err.message || "Failed to delete office" }, { status: 500 });
  }
}
