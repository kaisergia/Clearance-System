/**
 * app/api/requirements/department/[departmentId]/route.ts
 *
 * GET  /api/requirements/department/:departmentId
 * POST /api/requirements/department/:departmentId
 */
import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ departmentId: string }> }
) {
  try {
    const resolvedParams = await params;
    const departmentId = Number(resolvedParams.departmentId);
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

    await prisma.departmentRequirement.deleteMany({ where: { departmentId } });

    if (requirements?.length > 0) {
      await prisma.departmentRequirement.createMany({
        data: requirements.map((r: any) => ({
          // No `id` — let MySQL auto-generate to avoid PK conflicts
          departmentId,
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
    console.error("[POST /api/requirements/department/:id]", err);
    return NextResponse.json({ error: "Database error" }, { status: 500 });
  }
}
