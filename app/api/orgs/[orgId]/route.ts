import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

/**
 * GET handler to fetch a single org by ID
 */
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ orgId: string }> }
) {
  try {
    const { orgId } = await params;
    const id = parseInt(orgId, 10);
    
    if (isNaN(id)) {
      return NextResponse.json({ error: "Invalid org ID" }, { status: 400 });
    }

    const org = await prisma.org.findUnique({
      where: { id },
    });

    if (!org) {
      return NextResponse.json({ error: "Org not found" }, { status: 404 });
    }

    return NextResponse.json(org);
  } catch (err) {
    console.error("GET /api/orgs/[orgId] error:", err);
    return NextResponse.json({ error: "Failed to fetch org" }, { status: 500 });
  }
}

/**
 * PATCH handler to update org fields
 */
export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ orgId: string }> }
) {
  try {
    const { orgId } = await params;
    const id = parseInt(orgId, 10);
    
    if (isNaN(id)) {
      return NextResponse.json({ error: "Invalid org ID" }, { status: 400 });
    }

    const body = await request.json();
    const { logoUrl, name, adviser } = body;
    
    const updateData: any = {};
    if (logoUrl !== undefined) updateData.logoUrl = logoUrl;
    if (name !== undefined) updateData.name = name;
    if (adviser !== undefined) updateData.adviser = adviser;

    const updated = await prisma.org.update({
      where: { id },
      data: updateData,
    });
    
    return NextResponse.json(updated);
  } catch (err) {
    console.error("PATCH /api/orgs/[orgId] error:", err);
    return NextResponse.json({ error: "Failed to update org" }, { status: 500 });
  }
}
