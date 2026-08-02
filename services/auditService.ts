/**
 * services/auditService.ts
 *
 * Central Audit Service for recording institutional activity logs,
 * administrative authorization events, and student clearance status changes.
 */

import { prisma } from "@/lib/prisma";

export interface LogAuditParams {
  actorId?: string;
  actorName: string;
  actorRole: "admin" | "head_office" | "department" | "org" | "student" | "system" | string;
  action: "CLEAR_STUDENT" | "UNCLEAR_STUDENT" | "FLAG_DEFICIENCY" | "BATCH_CLEAR" | "AUTO_APPROVE" | "REQUIREMENT_UPDATE" | string;
  targetStudentId?: string;
  targetStudentName?: string;
  entityType?: "office" | "department" | "org" | "system" | string;
  entityId?: string | number;
  entityName?: string;
  details?: string;
  ipAddress?: string;
}

/**
 * Creates an immutable AuditLog record in the database
 */
export async function recordAuditLog(params: LogAuditParams) {
  try {
    const {
      actorId,
      actorName,
      actorRole,
      action,
      targetStudentId,
      targetStudentName,
      entityType,
      entityId,
      entityName,
      details,
      ipAddress,
    } = params;

    const audit = await prisma.auditLog.create({
      data: {
        actorId: actorId || null,
        actorName: actorName || "Signatory Evaluator",
        actorRole: actorRole || "head_office",
        action: action || "CLEAR_STUDENT",
        targetStudentId: targetStudentId || null,
        targetStudentName: targetStudentName || null,
        entityType: entityType || null,
        entityId: entityId ? String(entityId) : null,
        entityName: entityName || null,
        details: details || null,
        ipAddress: ipAddress || "127.0.0.1",
      },
    });

    console.log(`[AuditLog] Logged action: ${action} by ${actorName} for student ${targetStudentId || "N/A"}`);
    return audit;
  } catch (err) {
    console.error("[AuditService] Failed to record audit log:", err);
    return null;
  }
}

/**
 * Helper to log single student clearance / uncleared status changes
 */
export async function logClearanceAction(
  actorName: string,
  actorRole: string,
  targetStudentId: string,
  isCleared: boolean,
  entityType?: string,
  entityId?: string | number,
  entityName?: string,
  remarks?: string
) {
  let studentName = "";
  try {
    const st = await prisma.student.findUnique({ where: { id: targetStudentId }, select: { name: true } });
    if (st) studentName = st.name;
  } catch {}

  const action = isCleared ? "CLEAR_STUDENT" : remarks ? "FLAG_DEFICIENCY" : "UNCLEAR_STUDENT";
  const actionText = isCleared ? "marked CLEARED" : remarks ? `flagged DEFICIENCY: "${remarks}"` : "marked UNCLEARED";

  const details = `${actorName} (${actorRole}) ${actionText} for Student ${targetStudentId}${studentName ? ` (${studentName})` : ""}`;

  return recordAuditLog({
    actorName,
    actorRole,
    action,
    targetStudentId,
    targetStudentName: studentName,
    entityType,
    entityId,
    entityName,
    details,
  });
}

/**
 * Helper to log batch CSV / bulk clearance updates
 */
export async function logBatchClearanceAction(
  actorName: string,
  actorRole: string,
  count: number,
  actionType: "deficiency" | "clear" | "auto",
  entityType?: string,
  entityId?: string | number,
  entityName?: string
) {
  const action = actionType === "deficiency" ? "FLAG_DEFICIENCY" : "BATCH_CLEAR";
  const details = `${actorName} executed batch update processing ${count} constituent records (${actionType.toUpperCase()} mode) for ${entityName || entityType || "office"}.`;

  return recordAuditLog({
    actorName,
    actorRole,
    action,
    entityType,
    entityId,
    entityName,
    details,
  });
}
