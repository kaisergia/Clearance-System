/**
 * app/api/notifications/deadline-reminders/route.ts
 *
 * POST /api/notifications/deadline-reminders
 * Scans students with pending clearance requirements and issues 3-day or 24-hour
 * automated deadline warning alerts.
 */

import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { sendDeadlineWarningAlert } from "@/services/notificationService";

export async function POST(req: NextRequest) {
  try {
    const body = await req.json().catch(() => ({}));
    const daysLeft = typeof body.daysLeft === "number" ? body.daysLeft : 3;

    // Fetch all active students
    const students = await prisma.student.findMany({
      include: { clearanceRecords: true },
    });

    let triggeredCount = 0;

    for (const student of students) {
      const pendingRecords = student.clearanceRecords.filter((r) => r.status === "Pending");
      if (pendingRecords.length > 0) {
        await sendDeadlineWarningAlert(student.id, daysLeft, pendingRecords.length);
        triggeredCount++;
      }
    }

    return NextResponse.json({
      success: true,
      daysLeft,
      triggeredStudentsCount: triggeredCount,
      message: `Issued ${daysLeft}-day deadline warning alerts to ${triggeredCount} students with pending requirements.`,
    });
  } catch (err: any) {
    console.error("[POST /api/notifications/deadline-reminders]", err);
    return NextResponse.json({ error: "Failed to dispatch deadline reminders", details: err.message }, { status: 500 });
  }
}
