/**
 * app/api/requirements/office/[officeId]/route.ts
 *
 * GET  /api/requirements/office/:officeId  — list requirements for an office
 * POST /api/requirements/office/:officeId  — replace requirements for an office
 */
import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ officeId: string }> }
) {
  try {
    const resolvedParams = await params;
    const officeId = Number(resolvedParams.officeId);
    const reqs = await prisma.officeRequirement.findMany({
      where:   { officeId },
      orderBy: { addedDate: "asc" },
    });
    return NextResponse.json(reqs);
  } catch (err) {
    console.error("[GET /api/requirements/office/:id]", err);
    return NextResponse.json({ error: "Database error" }, { status: 500 });
  }
}

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ officeId: string }> }
) {
  try {
    const resolvedParams = await params;
    const officeId = Number(resolvedParams.officeId);
    const { requirements } = await req.json();

    await prisma.$transaction(async (tx) => {
      // Replace all requirements for this office
      await tx.officeRequirement.deleteMany({ where: { officeId } });

      if (requirements?.length > 0) {
        await tx.officeRequirement.createMany({
          data: requirements.map((r: any) => ({
            // No `id` — let MySQL auto-generate a fresh CUID to avoid PK conflicts
            officeId,
            name:           r.name,
            description:    r.description || "",
            linkName:       r.linkName || null,
            linkUrl:        r.linkUrl || null,
            addedDate:      r.addedDate || new Date().toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" }),
            status:         r.status || "Draft",
            appliesTo:      r.appliesTo || ["All Students"],
            deadline:       r.deadline || null,
            type:               r.type || "MANUAL",
            surveyQuestions:    r.surveyQuestions || null,
            acknowledgmentText: r.acknowledgmentText || null,
          })),
          skipDuplicates: true,
        });
      }

      // 1. Reset all clearance records for this office to Pending since requirements changed
      await tx.clearanceRecord.updateMany({
        where: { officeId },
        data: {
          status: "Pending",
          dateCleared: null,
        },
      });
    });

    // 2. Reset the affected students' overall status to Pending
    const affectedRecords = await prisma.clearanceRecord.findMany({
      where: { officeId },
      select: { studentId: true },
    });
    const studentIds = affectedRecords.map((r) => r.studentId);
    if (studentIds.length > 0) {
      await prisma.student.updateMany({
        where: { id: { in: studentIds } },
        data: { status: "Pending" },
      });
    }

    return NextResponse.json({ ok: true });
  } catch (err) {
    console.error("[POST /api/requirements/office/:id]", err);
    return NextResponse.json({ error: "Database error" }, { status: 500 });
  }
}
