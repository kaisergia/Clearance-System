/**
 * services/notificationService.ts
 *
 * Central Notification Service for handling In-App Notifications and
 * Email Alerts for Clearance Evaluation Results and Deadline Warnings.
 */

import { prisma } from "@/lib/prisma";

export interface CreateNotificationParams {
  studentId: string;
  title: string;
  message: string;
  type?: "evaluation" | "deadline_warning" | "announcement" | "general";
  linkUrl?: string;
}

/**
 * Creates an in-app notification record in the database
 */
export async function createNotification(params: CreateNotificationParams) {
  try {
    const { studentId, title, message, type = "evaluation", linkUrl } = params;

    const studentExists = await prisma.student.findUnique({ where: { id: studentId } });
    if (!studentExists) {
      console.warn(`[NotificationService] Cannot create notification: Student ${studentId} not found.`);
      return null;
    }

    const notification = await prisma.notification.create({
      data: {
        studentId,
        title,
        message,
        type,
        linkUrl: linkUrl || `/student/clearance-status`,
      },
    });

    return notification;
  } catch (err) {
    console.error("[NotificationService] Error creating notification:", err);
    return null;
  }
}

/**
 * Dispatches Evaluation Result Alert (In-App + Simulated Email Notification)
 */
export async function sendEvaluationResultAlert(
  studentId: string,
  requirementName: string,
  status: "Cleared" | "Pending" | "Rejected" | "Approved",
  remark?: string,
  evaluatorName?: string
) {
  const isApproved = status === "Cleared" || status === "Approved";
  const statusLabel = isApproved ? "APPROVED" : "REJECTED";
  const icon = isApproved ? "✅" : "⚠️";

  const title = `${icon} Requirement ${statusLabel}: ${requirementName}`;
  
  let message = isApproved
    ? `Your submission for "${requirementName}" was evaluated and APPROVED by ${evaluatorName || "the signatory office"}.`
    : `Your submission for "${requirementName}" was REJECTED by ${evaluatorName || "the signatory office"}.`;

  if (remark && remark.trim()) {
    message += ` Feedback / Remark: "${remark.trim()}"`;
  }

  if (!isApproved) {
    message += ` Please view your dashboard to resubmit the requirement before the deadline.`;
  }

  // 1. Create In-App Notification
  const notif = await createNotification({
    studentId,
    title,
    message,
    type: "evaluation",
    linkUrl: `/student/clearance-status`,
  });

  // 2. Simulate Email Dispatch
  const student = await prisma.student.findUnique({ where: { id: studentId } });
  if (student) {
    console.log(`
================================================================================
📧 [SIMULATED EMAIL DISPATCH]
To: ${student.email} (${student.name})
Subject: [CJC Clearance Alert] ${title}
--------------------------------------------------------------------------------
Dear ${student.name},

${message}

View Clearance Status: https://clearance.cjc.edu.ph/student/clearance-status

Best regards,
Cor Jesu College Clearance Office
================================================================================
    `);
  }

  return notif;
}

/**
 * Sends automated clearance deadline warning reminders (3-Day / 24-Hour Alerts)
 */
export async function sendDeadlineWarningAlert(studentId: string, daysLeft: number, pendingCount: number) {
  const urgency = daysLeft <= 1 ? "URGENT ⏰ 24 Hours Left" : `⚠️ ${daysLeft} Days Remaining`;
  const title = `${urgency}: Semester Clearance Deadline`;
  
  const message = `You still have ${pendingCount} pending clearance ${
    pendingCount === 1 ? "requirement" : "requirements"
  }. Please settle all deficiencies and complete submissions before the deadline.`;

  const notif = await createNotification({
    studentId,
    title,
    message,
    type: "deadline_warning",
    linkUrl: `/student/clearance-status`,
  });

  return notif;
}
