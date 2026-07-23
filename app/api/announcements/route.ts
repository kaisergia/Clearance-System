import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const scope = searchParams.get("scope"); // "public" | "all" | "student"
  const officeId = searchParams.get("officeId");
  const departmentId = searchParams.get("departmentId");
  const orgId = searchParams.get("orgId");
  const studentId = searchParams.get("studentId");
  const cursor = searchParams.get("cursor");
  const limitParam = searchParams.get("limit");

  const limit = limitParam ? parseInt(limitParam, 10) : 10;
  const now = new Date();

  try {
    // 1. Admin view: return everything, no filters
    if (scope === "all") {
      const announcements = await prisma.announcement.findMany({
        orderBy: [{ createdAt: "desc" }, { id: "desc" }],
      });
      return NextResponse.json(announcements);
    }

    // 2. Public landing page view: showOnLandingPage === true, active, not expired
    if (scope === "public" || (!officeId && !departmentId && !orgId && !studentId && !scope)) {
      const announcements = await prisma.announcement.findMany({
        where: {
          showOnLandingPage: true,
          isActive: true,
          OR: [
            { expiresAt: null },
            { expiresAt: { gt: now } },
          ],
        },
        orderBy: [
          { priority: "asc" },
          { createdAt: "desc" },
          { id: "desc" },
        ],
        include: {
          office: { select: { id: true, name: true, logoUrl: true, themeColor: true } },
          department: { select: { id: true, name: true, abbreviation: true, logoUrl: true, themeColor: true } },
          org: { select: { id: true, name: true, logoUrl: true, themeColor: true } },
        },
        take: 6,
      });

      const priorityWeight: Record<string, number> = { urgent: 0, high: 1, normal: 2, low: 3 };
      const sorted = announcements.sort((a, b) => {
        const w = (priorityWeight[a.priority] ?? 2) - (priorityWeight[b.priority] ?? 2);
        return w !== 0 ? w : b.createdAt.getTime() - a.createdAt.getTime();
      });

      return NextResponse.json(sorted);
    }

    // 3. Student view (Bulletin Board) with pagination
    if (scope === "student") {
      if (!studentId) {
        return NextResponse.json({ error: "studentId is required for student scope" }, { status: 400 });
      }

      // Resolve student's departmentId via mismatch logic: Student.department string -> Department.abbreviation / name
      const student = await prisma.student.findUnique({
        where: { id: studentId },
      });

      let resolvedDeptId: number | null = null;
      if (student?.department) {
        const dept = await prisma.department.findFirst({
          where: {
            OR: [
              { abbreviation: student.department },
              { name: student.department },
            ],
          },
        });
        if (dept) resolvedDeptId = dept.id;
      }

      // Resolve student's orgIds
      const orgMemberships = await prisma.orgMember.findMany({
        where: { studentId },
        select: { orgId: true },
      });
      const studentOrgIds = orgMemberships.map((m) => m.orgId);

      // Where clauses for student feed
      const orConditions: any[] = [
        { isSystemWide: true },
        { officeId: { not: null } },
      ];
      if (resolvedDeptId) {
        orConditions.push({ departmentId: resolvedDeptId });
      }
      if (studentOrgIds.length > 0) {
        orConditions.push({ orgId: { in: studentOrgIds } });
      }

      const where: any = {
        isActive: true,
        OR: [
          { expiresAt: null },
          { expiresAt: { gt: now } },
        ],
        AND: [
          { OR: orConditions },
        ],
      };

      if (cursor) {
        where.id = { lt: parseInt(cursor, 10) };
      }

      const items = await prisma.announcement.findMany({
        where,
        orderBy: [{ createdAt: "desc" }, { id: "desc" }],
        take: limit + 1,
        include: {
          office: { select: { id: true, name: true, logoUrl: true, themeColor: true } },
          department: { select: { id: true, name: true, abbreviation: true, logoUrl: true, themeColor: true } },
          org: { select: { id: true, name: true, logoUrl: true, themeColor: true } },
        },
      });

      let nextCursor: number | null = null;
      if (items.length > limit) {
        const nextItem = items.pop();
        nextCursor = nextItem?.id ?? null;
      }

      return NextResponse.json({
        announcements: items,
        nextCursor,
      });
    }

    // 4. Scoped for specific office / department / org dashboard
    const where: any = {};
    if (officeId) where.officeId = parseInt(officeId);
    if (departmentId) where.departmentId = parseInt(departmentId);
    if (orgId) where.orgId = parseInt(orgId);

    if (cursor) {
      where.id = { lt: parseInt(cursor, 10) };
    }

    const announcements = await prisma.announcement.findMany({
      where,
      orderBy: [{ createdAt: "desc" }, { id: "desc" }],
      take: limitParam || cursor ? limit + 1 : 20,
    });

    if (limitParam || cursor) {
      let nextCursor: number | null = null;
      if (announcements.length > limit) {
        const nextItem = announcements.pop();
        nextCursor = nextItem?.id ?? null;
      }
      return NextResponse.json({
        announcements,
        nextCursor,
      });
    }

    return NextResponse.json(announcements);
  } catch (err) {
    console.error("[GET /api/announcements]", err);
    return NextResponse.json([], { status: 200 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const {
      title,
      content,
      priority = "normal",
      isSystemWide = false,
      showOnLandingPage = false,
      eventDate,
      eventLocation,
      expiresAt,
      imageUrls = [],
      linkLabel,
      linkUrl,
      officeId,
      departmentId,
      orgId,
    } = body;

    if (!title || !content) {
      return NextResponse.json({ error: "title and content are required" }, { status: 400 });
    }

    const announcement = await prisma.announcement.create({
      data: {
        title,
        content,
        priority,
        isSystemWide,
        showOnLandingPage,
        eventDate: eventDate || null,
        eventLocation: eventLocation || null,
        expiresAt: expiresAt ? new Date(expiresAt) : null,
        imageUrls: imageUrls && imageUrls.length > 0 ? imageUrls : null,
        linkLabel: linkLabel || null,
        linkUrl: linkUrl || null,
        officeId: officeId ? parseInt(officeId) : null,
        departmentId: departmentId ? parseInt(departmentId) : null,
        orgId: orgId ? parseInt(orgId) : null,
      },
    });

    return NextResponse.json(announcement, { status: 201 });
  } catch (err) {
    console.error("[POST /api/announcements]", err);
    return NextResponse.json({ error: "Failed to create announcement" }, { status: 500 });
  }
}
