import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET(req: NextRequest) {
  try {
    const termId = req.nextUrl.searchParams.get("termId");
    const where: any = {};
    if (termId) {
      where.termId = parseInt(termId, 10);
    }

    const flows = await prisma.clearanceFlow.findMany({
      where,
      include: {
        steps: {
          include: {
            prerequisites: {
              include: {
                prerequisiteStep: true,
              },
            },
          },
          orderBy: { sequenceOrder: "asc" },
        },
        term: true,
      },
      orderBy: { createdAt: "desc" },
    });

    return NextResponse.json(flows);
  } catch (err) {
    console.error("[GET /api/flows]", err);
    return NextResponse.json({ error: "Database error" }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { id, name, description, termId, status, targetCriteria, steps = [] } = body;

    if (!name || !termId) {
      return NextResponse.json({ error: "Name and Term ID are required" }, { status: 400 });
    }

    if (status === "Published") {
      const existingPublished = await prisma.clearanceFlow.findFirst({
        where: {
          termId: Number(termId),
          status: "Published",
          id: id ? { not: Number(id) } : undefined,
        },
      });
      if (existingPublished) {
        return NextResponse.json(
          { error: "You cannot publish another clearance flow because there is already a published clearance flow for this term. Please unpublish the existing one in order to publish a new clearance flow." },
          { status: 400 }
        );
      }
    }

    const flowIdResult = await prisma.$transaction(async (tx) => {
      let flow;
      if (id) {
        // Update existing flow
        flow = await tx.clearanceFlow.update({
          where: { id: Number(id) },
          data: {
            name,
            description,
            termId: Number(termId),
            status: status || "Draft",
            targetCriteria: targetCriteria || null,
          },
        });
      } else {
        // Create new flow
        flow = await tx.clearanceFlow.create({
          data: {
            name,
            description,
            termId: Number(termId),
            status: status || "Draft",
            targetCriteria: targetCriteria || null,
          },
        });
      }

      const flowId = flow.id;

      // Clean up previous steps if updating
      await tx.flowStep.deleteMany({
        where: { flowId },
      });

      // Map steps to create them and keep track of the created IDs
      const createdSteps: { index: number; dbId: number; prerequisiteIndices: number[] }[] = [];

      for (let idx = 0; idx < steps.length; idx++) {
        const stepData = steps[idx];
        const createdStep = await tx.flowStep.create({
          data: {
            flowId,
            officeId: stepData.officeId ? Number(stepData.officeId) : null,
            departmentId: stepData.departmentId ? Number(stepData.departmentId) : null,
            orgId: stepData.orgId ? Number(stepData.orgId) : null,
            isDynamicDept: !!stepData.isDynamicDept,
            isDynamicOrgs: !!stepData.isDynamicOrgs,
            isPrerequisiteOnly: !!stepData.isPrerequisiteOnly,
            sequenceOrder: stepData.sequenceOrder != null ? Number(stepData.sequenceOrder) : idx + 1,
          },
        });

        createdSteps.push({
          index: idx,
          dbId: createdStep.id,
          prerequisiteIndices: stepData.prerequisiteIndices || [],
        });
      }

      // Now create the prerequisites
      for (const stepInfo of createdSteps) {
        for (const prereqIdx of stepInfo.prerequisiteIndices) {
          const prereqStep = createdSteps.find((s) => s.index === prereqIdx);
          if (prereqStep) {
            await tx.flowStepPrerequisite.create({
              data: {
                stepId: stepInfo.dbId,
                prerequisiteStepId: prereqStep.dbId,
              },
            });
          }
        }
      }

      // Sync student clearance records if published
      if (status === "Published") {
        await syncStudentClearanceRecords(flowId, tx);
      }

      return flowId;
    });

    // Fetch and return the fully populated flow
    const fullFlow = await prisma.clearanceFlow.findUnique({
      where: { id: flowIdResult },
      include: {
        steps: {
          include: {
            prerequisites: {
              include: {
                prerequisiteStep: true,
              },
            },
          },
          orderBy: { sequenceOrder: "asc" },
        },
      },
    });

    return NextResponse.json(fullFlow);
  } catch (err) {
    console.error("[POST /api/flows]", err);
    return NextResponse.json({ error: "Database error" }, { status: 500 });
  }
}

async function syncStudentClearanceRecords(flowId: number, tx: any) {
  const flow = await tx.clearanceFlow.findUnique({
    where: { id: flowId },
    include: { steps: true, term: true },
  });
  if (!flow || flow.status !== "Published") return;

  let criteria: any = {};
  try {
    if (typeof flow.targetCriteria === "string") {
      criteria = JSON.parse(flow.targetCriteria);
    } else if (flow.targetCriteria && typeof flow.targetCriteria === "object") {
      criteria = flow.targetCriteria;
    }
  } catch (e) {
    console.error("Error parsing target criteria", e);
  }

  const whereClause: any = {};
  if (criteria.years && criteria.years.length > 0) {
    whereClause.year = { in: criteria.years };
  }
  if (criteria.departments && criteria.departments.length > 0) {
    whereClause.department = { in: criteria.departments };
  }
  const students = await tx.student.findMany({ where: whereClause });

  const officeReqs = await tx.officeRequirement.findMany({
    where: { termId: flow.termId },
    select: { id: true },
  });
  const deptReqs = await tx.departmentRequirement.findMany({
    where: { termId: flow.termId },
    select: { id: true },
  });
  const orgReqs = await tx.orgRequirement.findMany({
    where: { termId: flow.termId },
    select: { id: true },
  });

  const termReqIds = [
    ...officeReqs.map((r: any) => r.id),
    ...deptReqs.map((r: any) => r.id),
    ...orgReqs.map((r: any) => r.id),
  ];

  if (termReqIds.length > 0 && students.length > 0) {
    await tx.requirementSubmission.deleteMany({
      where: {
        studentId: { in: students.map((s: any) => s.id) },
        requirementId: { in: termReqIds },
      },
    });
  }

  for (const student of students) {
    for (const step of flow.steps) {
      let recordsToCreate: { officeId?: number; departmentId?: number; orgId?: number }[] = [];

      if (step.officeId) {
        recordsToCreate.push({ officeId: step.officeId });
      } else if (step.departmentId) {
        recordsToCreate.push({ departmentId: step.departmentId });
      } else if (step.orgId) {
        recordsToCreate.push({ orgId: step.orgId });
      } else if (step.isDynamicDept) {
        const dept = await tx.department.findUnique({
          where: { abbreviation: student.department },
        });
        if (dept) {
          recordsToCreate.push({ departmentId: dept.id });
        }
      } else if (step.isDynamicOrgs) {
        const memberships = await tx.orgMember.findMany({
          where: { studentId: student.id },
        });
        for (const m of memberships) {
          recordsToCreate.push({ orgId: m.orgId });
        }
      }

      for (const item of recordsToCreate) {
        let actualWhereClause: any = null;
        if (item.officeId) {
          actualWhereClause = { studentId_officeId_termId: { studentId: student.id, officeId: item.officeId, termId: flow.termId } };
        } else if (item.orgId) {
          actualWhereClause = { studentId_orgId_termId: { studentId: student.id, orgId: item.orgId, termId: flow.termId } };
        } else if (item.departmentId) {
          actualWhereClause = { studentId_departmentId_termId: { studentId: student.id, departmentId: item.departmentId, termId: flow.termId } };
        }

        if (actualWhereClause) {
          await tx.clearanceRecord.upsert({
            where: actualWhereClause,
            update: {
              status: "Pending",
              dateCleared: null,
              remarks: "",
            },
            create: {
              studentId: student.id,
              termId: flow.termId,
              status: "Pending",
              ...item,
            },
          });
        }
      }
    }
  }
}

export async function PATCH(req: NextRequest) {
  try {
    const { id, status } = await req.json();
    if (!id || !status) {
      return NextResponse.json({ error: "ID and Status are required" }, { status: 400 });
    }

    const flowToUpdate = await prisma.clearanceFlow.findUnique({
      where: { id: Number(id) },
    });

    if (!flowToUpdate) {
      return NextResponse.json({ error: "Clearance flow not found" }, { status: 404 });
    }

    if (status === "Published") {
      const existingPublished = await prisma.clearanceFlow.findFirst({
        where: {
          termId: flowToUpdate.termId,
          status: "Published",
          id: { not: flowToUpdate.id },
        },
      });
      if (existingPublished) {
        return NextResponse.json(
          { error: "You cannot publish another clearance flow because there is already a published clearance flow for this term. Please unpublish the existing one in order to publish a new clearance flow." },
          { status: 400 }
        );
      }
    }

    const updatedFlow = await prisma.clearanceFlow.update({
      where: { id: Number(id) },
      data: { status },
    });

    if (status === "Published") {
      await prisma.$transaction(async (tx) => {
        await syncStudentClearanceRecords(updatedFlow.id, tx);
      });
    }

    return NextResponse.json(updatedFlow);
  } catch (err) {
    console.error("[PATCH /api/flows]", err);
    return NextResponse.json({ error: "Database error" }, { status: 500 });
  }
}
