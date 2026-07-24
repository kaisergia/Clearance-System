/**
 * app/api/submissions/route.ts
 *
 * GET /api/submissions
 * Retrieves requirement submissions filtered by officeId, departmentId, or orgId.
 */
import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const officeId = searchParams.get("officeId");
    const departmentId = searchParams.get("departmentId");
    const orgId = searchParams.get("orgId");

    let reqIds: string[] = [];

    if (officeId) {
      const officeReqs = await prisma.officeRequirement.findMany({
        where: { officeId: parseInt(officeId, 10) },
      });
      reqIds = officeReqs.map((r) => r.id);
    } else if (departmentId) {
      const deptReqs = await prisma.departmentRequirement.findMany({
        where: { departmentId: parseInt(departmentId, 10) },
      });
      reqIds = deptReqs.map((r) => r.id);
    } else if (orgId) {
      const orgReqs = await prisma.orgRequirement.findMany({
        where: { orgId: parseInt(orgId, 10) },
      });
      reqIds = orgReqs.map((r) => r.id);
    } else {
      // If no filter, return all submissions
      const submissions = await prisma.requirementSubmission.findMany({
        orderBy: { submittedAt: "desc" },
      });
      return NextResponse.json(submissions);
    }

    // Fetch submissions matching the entity's requirements
    const submissions = await prisma.requirementSubmission.findMany({
      where: {
        requirementId: { in: reqIds },
      },
      orderBy: { submittedAt: "desc" },
    });

    return NextResponse.json(submissions);
  } catch (err) {
    console.error("[GET /api/submissions]", err);
    return NextResponse.json({ error: "Database error" }, { status: 500 });
  }
}
