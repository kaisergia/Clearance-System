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
    const { logoUrl, name, head, email } = body;
    
    const updateData: any = {};
    if (logoUrl !== undefined) updateData.logoUrl = logoUrl;
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
