/**
 * app/api/clearance-records/route.ts
 *
 * GET  /api/clearance-records?studentId=xxx  — fetch records for a student
 * POST /api/clearance-records               — upsert a clearance record
 */
import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET(req: NextRequest) {
  try {
    const studentId = req.nextUrl.searchParams.get("studentId");
    const officeId = req.nextUrl.searchParams.get("officeId");
    const departmentId = req.nextUrl.searchParams.get("departmentId");
    const orgId = req.nextUrl.searchParams.get("orgId");

    const where: any = {};
    if (studentId) where.studentId = studentId;
    if (officeId) where.officeId = parseInt(officeId, 10);
    if (departmentId) where.departmentId = parseInt(departmentId, 10);
    if (orgId) where.orgId = parseInt(orgId, 10);

    if (!studentId && !officeId && !departmentId && !orgId) {
      return NextResponse.json({ error: "At least one filter (studentId, officeId, departmentId, orgId) is required" }, { status: 400 });
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
    const { studentId, entityId, type, status, data = {} } = await req.json();

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
        where:  { studentId_officeId: { studentId, officeId: entityId } },
        update: payload,
        create: { studentId, officeId: entityId, ...payload },
      });
    } else if (type === "org") {
      record = await prisma.clearanceRecord.upsert({
        where:  { studentId_orgId: { studentId, orgId: entityId } },
        update: payload,
        create: { studentId, orgId: entityId, ...payload },
      });
    } else if (type === "department") {
      record = await prisma.clearanceRecord.upsert({
        where:  { studentId_departmentId: { studentId, departmentId: entityId } },
        update: payload,
        create: { studentId, departmentId: entityId, ...payload },
      });
    } else {
      return NextResponse.json({ error: "Invalid type" }, { status: 400 });
    }

    // Sync overall student status
    const allRecords = await prisma.clearanceRecord.findMany({ where: { studentId } });
    const allCleared = allRecords.length > 0 && allRecords.every((r) => r.status === "Cleared");
    await prisma.student.update({
      where:  { id: studentId },
      data:   { status: allCleared ? "Cleared" : "Pending" },
    });

    return NextResponse.json({ ok: true, record });
  } catch (err) {
    console.error("[POST /api/clearance-records]", err);
    return NextResponse.json({ error: "Database error" }, { status: 500 });
  }
}
