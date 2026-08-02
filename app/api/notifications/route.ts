/**
 * app/api/notifications/route.ts
 *
 * GET /api/notifications?studentId=...
 * Retrieves in-app notifications for a student with unread count.
 *
 * PATCH /api/notifications
 * Body: { id?: string, studentId?: string, markAllRead?: boolean }
 * Marks single notification or all student notifications as read.
 */

import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const studentId = searchParams.get("studentId");

    if (!studentId) {
      return NextResponse.json({ error: "studentId parameter is required" }, { status: 400 });
    }

    const notifications = await prisma.notification.findMany({
      where: { studentId },
      orderBy: { createdAt: "desc" },
      take: 50,
    });

    const unreadCount = await prisma.notification.count({
      where: { studentId, status: "unread" },
    });

    return NextResponse.json({
      notifications,
      unreadCount,
    });
  } catch (err: any) {
    console.error("[GET /api/notifications]", err);
    return NextResponse.json({ error: "Failed to fetch notifications", details: err.message }, { status: 500 });
  }
}

export async function PATCH(req: NextRequest) {
  try {
    const body = await req.json();
    const { id, studentId, markAllRead } = body;

    if (markAllRead && studentId) {
      await prisma.notification.updateMany({
        where: { studentId, status: "unread" },
        data: { status: "read", readAt: new Date() },
      });

      return NextResponse.json({ success: true, message: "All notifications marked as read." });
    }

    if (id) {
      const updated = await prisma.notification.update({
        where: { id },
        data: { status: "read", readAt: new Date() },
      });

      return NextResponse.json({ success: true, notification: updated });
    }

    return NextResponse.json({ error: "Either id or (studentId + markAllRead) is required" }, { status: 400 });
  } catch (err: any) {
    console.error("[PATCH /api/notifications]", err);
    return NextResponse.json({ error: "Failed to update notification status", details: err.message }, { status: 500 });
  }
}
