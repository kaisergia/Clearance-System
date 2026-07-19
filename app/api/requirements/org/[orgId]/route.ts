/**
 * app/api/requirements/org/[orgId]/route.ts
 *
 * GET  /api/requirements/org/:orgId
 * POST /api/requirements/org/:orgId
 */
import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ orgId: string }> }
) {
  try {
    const resolvedParams = await params;
    const orgId = Number(resolvedParams.orgId);
    const reqs = await prisma.orgRequirement.findMany({
      where: { orgId },
      orderBy: { addedDate: "asc" },
    });
    return NextResponse.json(reqs);
  } catch (err) {
    console.error("[GET /api/requirements/org/:id]", err);
    return NextResponse.json({ error: "Database error" }, { status: 500 });
  }
}

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ orgId: string }> }
) {
  try {
    const resolvedParams = await params;
    const orgId = Number(resolvedParams.orgId);
    const { requirements } = await req.json();

    await prisma.orgRequirement.deleteMany({ where: { orgId } });

    if (requirements?.length > 0) {
      await prisma.orgRequirement.createMany({
        data: requirements.map((r: any) => ({
          // No `id` — let MySQL auto-generate to avoid PK conflicts
          orgId,
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
    console.error("[POST /api/requirements/org/:id]", err);
    return NextResponse.json({ error: "Database error" }, { status: 500 });
  }
}
