/**
 * app/api/clearance-records/route.ts
 *
 * GET  /api/clearance-records?studentId=xxx  — fetch records for a student
 * POST /api/clearance-records               — upsert a clearance record (includes prerequisite check)
 */
import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { checkPrerequisites } from "@/lib/clearancePrereqs";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/authOptions";
import { recordAuditLog } from "@/services/auditService";
import { sendEvaluationResultAlert } from "@/services/notificationService";

export async function GET(req: NextRequest) {
  try {
    const studentId = req.nextUrl.searchParams.get("studentId");
    const officeId = req.nextUrl.searchParams.get("officeId");
    const departmentId = req.nextUrl.searchParams.get("departmentId");
    const orgId = req.nextUrl.searchParams.get("orgId");
    const termId = req.nextUrl.searchParams.get("termId");

    const where: any = {};
    if (studentId) where.studentId = studentId;
    if (officeId) where.officeId = parseInt(officeId, 10);
    if (departmentId) where.departmentId = parseInt(departmentId, 10);
    if (orgId) where.orgId = parseInt(orgId, 10);
    if (termId) where.termId = parseInt(termId, 10);

    if (!studentId && !officeId && !departmentId && !orgId && !termId) {
      return NextResponse.json({ error: "At least one filter (studentId, officeId, departmentId, orgId, termId) is required" }, { status: 400 });
    }

    const records = await prisma.clearanceRecord.findMany({
      where,
    });

    // Normalise to the same shape the UI expects
    return NextResponse.json(
      records.map((r) => ({
        studentId:     r.studentId,
        officeId:      r.officeId ?? undefined,
        orgId:         r.orgId ?? undefined,
        departmentId:  r.departmentId ?? undefined,
        termId:        r.termId ?? undefined,
        status:        r.status,
        dateCleared:   r.dateCleared,
        remarks:       r.remarks,
        uploadedFiles: r.uploadedFiles,
        completedTasks: r.completedTasks,
      }))
    );
  } catch (err) {
    console.error("[GET /api/clearance-records]", err);
    return NextResponse.json({ error: "Database error" }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const { studentId, entityId, type, status, termId: reqTermId, data = {} } = await req.json();

    if (!studentId || !entityId || !type || !status) {
      return NextResponse.json({ error: "Missing required fields" }, { status: 400 });
    }

    // Find the active term if not specified
    const activeTerm = await prisma.academicTerm.findFirst({
      where: { status: "Active" },
    });
    const termId = reqTermId ? Number(reqTermId) : activeTerm?.id || null;
    if (!termId) {
      return NextResponse.json({ error: "Active academic term is required" }, { status: 400 });
    }

    // Validate prerequisites if status is being updated to "Cleared"
    if (status === "Cleared" && termId) {
      const prereqCheck = await checkPrerequisites(studentId, termId, type, Number(entityId));
      if (!prereqCheck.allowed) {
        return NextResponse.json(
          { error: prereqCheck.error },
          { status: 400 }
        );
      }
    }

    const dateCleared =
      status === "Cleared"
        ? new Date().toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" })
        : null;

    const payload = {
      status,
      dateCleared: data.dateCleared !== undefined ? data.dateCleared : dateCleared,
      remarks: data.remarks || "",
      uploadedFiles: data.uploadedFiles ?? null,
      completedTasks: data.completedTasks ?? null,
    };

    let record;
    if (type === "office") {
      record = await prisma.clearanceRecord.upsert({
        where: {
          studentId_officeId_termId: {
            studentId,
            officeId: Number(entityId),
            termId,
          },
        },
        update: payload,
        create: { studentId, officeId: Number(entityId), termId, ...payload },
      });
    } else if (type === "org") {
      record = await prisma.clearanceRecord.upsert({
        where: {
          studentId_orgId_termId: {
            studentId,
            orgId: Number(entityId),
            termId,
          },
        },
        update: payload,
        create: { studentId, orgId: Number(entityId), termId, ...payload },
      });
    } else if (type === "department") {
      record = await prisma.clearanceRecord.upsert({
        where: {
          studentId_departmentId_termId: {
            studentId,
            departmentId: Number(entityId),
            termId,
          },
        },
        update: payload,
        create: { studentId, departmentId: Number(entityId), termId, ...payload },
      });
    } else {
      return NextResponse.json({ error: "Invalid type" }, { status: 400 });
    }

    // Sync overall student status
    const allRecords = await prisma.clearanceRecord.findMany({ where: { studentId, termId } });
    const allCleared = allRecords.length > 0 && allRecords.every((r) => r.status === "Cleared");
    await prisma.student.update({
      where: { id: studentId },
      data: { status: allCleared ? "Cleared" : "Pending" },
    });

    // Record Audit Log
    try {
      const session = await getServerSession(authOptions);
      const actorName = session?.user?.name || session?.user?.email || "Signatory Evaluator";
      const actorRole = (session?.user as any)?.role || "head_office";

      const student = await prisma.student.findUnique({ where: { id: studentId }, select: { name: true } });
      const studentName = student?.name || "Student";

      let entityName = "Signatory";
      if (type === "office") {
        const o = await prisma.office.findUnique({ where: { id: Number(entityId) }, select: { name: true } });
        if (o) entityName = o.name;
      } else if (type === "department") {
        const d = await prisma.department.findUnique({ where: { id: Number(entityId) }, select: { name: true } });
        if (d) entityName = d.name;
      } else if (type === "org") {
        const og = await prisma.org.findUnique({ where: { id: Number(entityId) }, select: { name: true } });
        if (og) entityName = og.name;
      }

      const details = `${actorName} (${actorRole}) updated overall clearance status to "${status}" for Student ${studentId} (${studentName}) at ${entityName}.${data.remarks ? ` Remarks: "${data.remarks}"` : ""}`;

      await recordAuditLog({
        actorId: session?.user?.email || undefined,
        actorName,
        actorRole,
        action: status === "Cleared" ? "CLEAR_STUDENT" : status === "Rejected" ? "FLAG_DEFICIENCY" : "UNCLEAR_STUDENT",
        targetStudentId: studentId,
        targetStudentName: studentName,
        entityType: type,
        entityId: String(entityId),
        entityName,
        details,
      });

      // Dispatch Student In-App Notification & Alert
      await sendEvaluationResultAlert(
        studentId,
        entityName,
        status as any,
        data?.remarks || undefined,
        actorName
      );
    } catch (auditErr) {
      console.error("[ClearanceRecords POST] Failed to log audit/notification event:", auditErr);
    }

    return NextResponse.json({ ok: true, record });
  } catch (err) {
    console.error("[POST /api/clearance-records]", err);
    return NextResponse.json({ error: "Database error" }, { status: 500 });
  }
}
