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

    // Replace all requirements for this office
    await prisma.officeRequirement.deleteMany({ where: { officeId } });

    if (requirements?.length > 0) {
      await prisma.officeRequirement.createMany({
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

    return NextResponse.json({ ok: true });
  } catch (err) {
    console.error("[POST /api/requirements/office/:id]", err);
    return NextResponse.json({ error: "Database error" }, { status: 500 });
  }
}
