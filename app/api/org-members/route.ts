/**
 * app/api/org-members/route.ts
 * GET /api/org-members?orgId=N — returns student IDs that are members of an org
 * GET /api/org-members?studentId=X — returns org IDs that a student belongs to
 */
import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const orgId = searchParams.get("orgId");
  const studentId = searchParams.get("studentId");

  try {
    if (orgId) {
      const members = await prisma.orgMember.findMany({
        where: { orgId: Number(orgId) },
        select: { studentId: true },
      });
      return NextResponse.json(members.map((m) => m.studentId));
    }

    if (studentId) {
      const memberships = await prisma.orgMember.findMany({
        where: { studentId },
        include: { org: true },
      });
      return NextResponse.json(memberships);
    }

    return NextResponse.json({ error: "orgId or studentId query param required" }, { status: 400 });
  } catch (err) {
    console.error("[GET /api/org-members]", err);
    return NextResponse.json({ error: "Database error" }, { status: 500 });
  }
}
