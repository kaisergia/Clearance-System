/**
 * app/api/requirements/department/[departmentId]/route.ts
 *
 * GET  /api/requirements/department/:departmentId
 * POST /api/requirements/department/:departmentId
 */
import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { ensureRequirementsForTerm } from "@/lib/requirementCloner";

export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ departmentId: string }> }
) {
  try {
    const resolvedParams = await params;
    const departmentId = Number(resolvedParams.departmentId);

    // Find the active academic term
    const activeTerm = await prisma.academicTerm.findFirst({
      where: { status: "Active" },
    });

    if (activeTerm) {
      await ensureRequirementsForTerm(activeTerm.id, [], [departmentId], []);
      const reqs = await prisma.departmentRequirement.findMany({
        where:   { departmentId, termId: activeTerm.id },
        orderBy: { addedDate: "asc" },
      });
      return NextResponse.json(reqs);
    }

    const reqs = await prisma.departmentRequirement.findMany({
      where: { departmentId },
      orderBy: { addedDate: "asc" },
    });
    return NextResponse.json(reqs);
  } catch (err) {
    console.error("[GET /api/requirements/department/:id]", err);
    return NextResponse.json({ error: "Database error" }, { status: 500 });
  }
}

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ departmentId: string }> }
) {
  try {
    const resolvedParams = await params;
    const departmentId = Number(resolvedParams.departmentId);
    const { requirements } = await req.json();

    // 1. Get or auto-create active academic term
    let activeTerm = await prisma.academicTerm.findFirst({
      where: { status: "Active" },
    });

    if (!activeTerm) {
      activeTerm = await prisma.academicTerm.create({
        data: { name: "1st Semester 2025-2026", status: "Active" },
      });
    }

    await prisma.$transaction(async (tx) => {
      await tx.departmentRequirement.deleteMany({ where: { departmentId } });

      if (requirements?.length > 0) {
        await tx.departmentRequirement.createMany({
          data: requirements.map((r: any) => ({
            // No `id` — let MySQL auto-generate to avoid PK conflicts
            departmentId,
            termId:             activeTerm.id,
            name:               r.name,
            description:        r.description || "",
            linkName:           r.linkName || null,
            linkUrl:            r.linkUrl || null,
            addedDate:          r.addedDate || new Date().toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" }),
            status:             r.status || "Draft",
            appliesTo:          r.appliesTo || ["All Students"],
            deadline:           r.deadline || null,
            type:               r.type || "MANUAL",
            surveyQuestions:    r.surveyQuestions || null,
            acknowledgmentText: r.acknowledgmentText || null,
            allowedFileTypes:   r.allowedFileTypes || null,
          })),
          skipDuplicates: true,
        });
      }

      // 1. Reset all clearance records for this department to Pending since requirements changed
      await tx.clearanceRecord.updateMany({
        where: { departmentId },
        data: {
          status: "Pending",
          dateCleared: null,
        },
      });
    });

    // 2. Reset the affected students' overall status to Pending
    const affectedRecords = await prisma.clearanceRecord.findMany({
      where: { departmentId },
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
    console.error("[POST /api/requirements/department/:id]", err);
    return NextResponse.json({ error: "Database error" }, { status: 500 });
  }
}
