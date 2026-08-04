import { prisma } from "./prisma";

export async function ensureRequirementsForTerm(
  termId: number,
  officeIds: number[],
  departmentIds: number[],
  orgIds: number[]
) {
  // 1. Office Requirements
  for (const officeId of officeIds) {
    const count = await prisma.officeRequirement.count({
      where: { officeId, termId },
    });
    if (count === 0) {
      const pastReqs = await prisma.officeRequirement.findMany({
        where: { officeId },
        orderBy: { addedDate: "asc" },
      });
      const termIds = Array.from(new Set(pastReqs.map((r) => r.termId).filter(Boolean))) as number[];
      if (termIds.length > 0) {
        const maxTermId = Math.max(...termIds);
        const toClone = pastReqs.filter((r) => r.termId === maxTermId);
        await prisma.officeRequirement.createMany({
          data: toClone.map((r) => ({
            officeId,
            termId,
            name: r.name,
            description: r.description || "",
            linkName: r.linkName || null,
            linkUrl: r.linkUrl || null,
            addedDate: new Date().toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" }),
            status: r.status,
            appliesTo: r.appliesTo as any,
            deadline: r.deadline || null,
            type: r.type,
            surveyQuestions: r.surveyQuestions as any,
            acknowledgmentText: r.acknowledgmentText || null,
          })) as any[],
          skipDuplicates: true,
        });
      }
    }
  }

  // 2. Department Requirements
  for (const departmentId of departmentIds) {
    const count = await prisma.departmentRequirement.count({
      where: { departmentId, termId },
    });
    if (count === 0) {
      const pastReqs = await prisma.departmentRequirement.findMany({
        where: { departmentId },
        orderBy: { addedDate: "asc" },
      });
      const termIds = Array.from(new Set(pastReqs.map((r) => r.termId).filter(Boolean))) as number[];
      if (termIds.length > 0) {
        const maxTermId = Math.max(...termIds);
        const toClone = pastReqs.filter((r) => r.termId === maxTermId);
        await prisma.departmentRequirement.createMany({
          data: toClone.map((r) => ({
            departmentId,
            termId,
            name: r.name,
            description: r.description || "",
            linkName: r.linkName || null,
            linkUrl: r.linkUrl || null,
            addedDate: new Date().toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" }),
            status: r.status,
            appliesTo: r.appliesTo as any,
            deadline: r.deadline || null,
            type: r.type,
            surveyQuestions: r.surveyQuestions as any,
            acknowledgmentText: r.acknowledgmentText || null,
          })) as any[],
          skipDuplicates: true,
        });
      }
    }
  }

  // 3. Org Requirements
  for (const orgId of orgIds) {
    const count = await prisma.orgRequirement.count({
      where: { orgId, termId },
    });
    if (count === 0) {
      const pastReqs = await prisma.orgRequirement.findMany({
        where: { orgId },
        orderBy: { addedDate: "asc" },
      });
      const termIds = Array.from(new Set(pastReqs.map((r) => r.termId).filter(Boolean))) as number[];
      if (termIds.length > 0) {
        const maxTermId = Math.max(...termIds);
        const toClone = pastReqs.filter((r) => r.termId === maxTermId);
        await prisma.orgRequirement.createMany({
          data: toClone.map((r) => ({
            orgId,
            termId,
            name: r.name,
            description: r.description || "",
            linkName: r.linkName || null,
            linkUrl: r.linkUrl || null,
            addedDate: new Date().toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" }),
            status: r.status,
            appliesTo: r.appliesTo as any,
            deadline: r.deadline || null,
            type: r.type,
            surveyQuestions: r.surveyQuestions as any,
            acknowledgmentText: r.acknowledgmentText || null,
          })) as any[],
          skipDuplicates: true,
        });
      }
    }
  }
}
