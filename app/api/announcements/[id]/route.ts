import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

// GET /api/announcements/:id
export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const announcementId = parseInt(id, 10);
    if (isNaN(announcementId)) {
      return NextResponse.json({ error: "Invalid announcement ID" }, { status: 400 });
    }

    const announcement = await prisma.announcement.findUnique({
      where: { id: announcementId },
      include: {
        office: { select: { id: true, name: true, logoUrl: true } },
        department: { select: { id: true, name: true, abbreviation: true, logoUrl: true } },
        org: { select: { id: true, name: true, logoUrl: true } },
      },
    });

    if (!announcement) {
      return NextResponse.json({ error: "Announcement not found" }, { status: 404 });
    }

    return NextResponse.json(announcement);
  } catch (err) {
    console.error("[GET /api/announcements/:id]", err);
    return NextResponse.json({ error: "Failed to fetch announcement" }, { status: 500 });
  }
}

// PATCH /api/announcements/:id
export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const body = await request.json();

    const updated = await prisma.announcement.update({
      where: { id: parseInt(id, 10) },
      data: {
        ...(body.title !== undefined && { title: body.title }),
        ...(body.content !== undefined && { content: body.content }),
        ...(body.priority !== undefined && { priority: body.priority }),
        ...(body.isSystemWide !== undefined && { isSystemWide: body.isSystemWide }),
        ...(body.showOnLandingPage !== undefined && { showOnLandingPage: body.showOnLandingPage }),
        ...(body.isActive !== undefined && { isActive: body.isActive }),
        ...(body.eventDate !== undefined && { eventDate: body.eventDate }),
        ...(body.eventLocation !== undefined && { eventLocation: body.eventLocation }),
        ...(body.expiresAt !== undefined && { expiresAt: body.expiresAt ? new Date(body.expiresAt) : null }),
        ...(body.imageUrls !== undefined && { imageUrls: body.imageUrls }),
        ...(body.linkLabel !== undefined && { linkLabel: body.linkLabel }),
        ...(body.linkUrl !== undefined && { linkUrl: body.linkUrl }),
        ...(body.officeId !== undefined && { officeId: body.officeId }),
        ...(body.departmentId !== undefined && { departmentId: body.departmentId }),
        ...(body.orgId !== undefined && { orgId: body.orgId }),
      },
    });

    return NextResponse.json(updated);
  } catch (err) {
    console.error("[PATCH /api/announcements/:id]", err);
    return NextResponse.json({ error: "Failed to update" }, { status: 500 });
  }
}

// DELETE /api/announcements/:id
export async function DELETE(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    await prisma.announcement.delete({ where: { id: parseInt(id, 10) } });
    return NextResponse.json({ ok: true });
  } catch (err) {
    console.error("[DELETE /api/announcements/:id]", err);
    return NextResponse.json({ error: "Failed to delete" }, { status: 500 });
  }
}
