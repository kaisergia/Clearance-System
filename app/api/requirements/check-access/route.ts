import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const type = searchParams.get("type");
    const idStr = searchParams.get("id");

    if (!type || !idStr) {
      return NextResponse.json({ error: "Type and ID are required" }, { status: 400 });
    }

    const id = Number(idStr);
    if (isNaN(id)) {
      return NextResponse.json({ error: "ID must be a number" }, { status: 400 });
    }

    // 1. Get the active academic term
    const activeTerm = await prisma.academicTerm.findFirst({
      where: { status: "Active" },
    });

    if (!activeTerm) {
      return NextResponse.json({
        hasAccess: false,
        reason: "No active academic term. Clearance flows cannot be configured, and requirements cannot be published."
      });
    }

    // 2. Find published clearance flows for this term
    const activeFlows = await prisma.clearanceFlow.findMany({
      where: { termId: activeTerm.id, status: "Published" },
      include: {
        steps: true,
      },
    });

    if (activeFlows.length === 0) {
      return NextResponse.json({
        hasAccess: false,
        reason: "No published clearance flow exists for the active academic term. You cannot publish clearance requirements at this time."
      });
    }

    // 3. Check if the signatory is declared in the flows
    let isDeclared = false;
    for (const flow of activeFlows) {
      for (const step of flow.steps) {
        if (type === "office" && step.officeId === id) {
          isDeclared = true;
          break;
        }
        if (type === "department" && (step.departmentId === id || step.isDynamicDept)) {
          isDeclared = true;
          break;
        }
        if (type === "org" && (step.orgId === id || step.isDynamicOrgs)) {
          isDeclared = true;
          break;
        }
      }
      if (isDeclared) break;
    }

    if (!isDeclared) {
      const typeLabel = type === "office" ? "office" : type === "department" ? "department" : "organization";
      return NextResponse.json({
        hasAccess: false,
        reason: `Your ${typeLabel} is not declared as a signatory in the active published clearance flow. You cannot configure or publish clearance requirements.`
      });
    }

    return NextResponse.json({ hasAccess: true });
  } catch (err) {
    console.error("[GET /api/requirements/check-access]", err);
    return NextResponse.json({ error: "Database error" }, { status: 500 });
  }
}
