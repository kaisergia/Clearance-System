const { PrismaClient } = require("@prisma/client");
const prisma = new PrismaClient();

async function run() {
  try {
    let activeTerm = await prisma.academicTerm.findFirst({
      where: { status: "Active" }
    });
    if (!activeTerm) {
      console.log("No active term found. Fetching any term...");
      activeTerm = await prisma.academicTerm.findFirst();
    }

    if (!activeTerm) {
      console.log("No terms exist at all. Creating a dummy active term...");
      activeTerm = await prisma.academicTerm.create({
        data: {
          name: "2025-2026 1st Semester",
          status: "Active"
        }
      });
    }

    console.log("Term used:", activeTerm.id, activeTerm.name, activeTerm.status);

    // Let's check existing flows
    const flows = await prisma.clearanceFlow.findMany();
    console.log("Existing flows:", flows.map(f => ({ id: f.id, name: f.name, status: f.status })));

    // Let's attempt to create a clearance flow
    const newFlow = await prisma.clearanceFlow.create({
      data: {
        name: "Test Flow " + Date.now(),
        description: "Test flow creation",
        termId: activeTerm.id,
        status: "Draft",
        targetCriteria: { years: ["4th Year"], departments: ["CCIS"] }
      }
    });
    console.log("Successfully created test flow:", newFlow.id);

    // Let's try adding steps to it
    const step1 = await prisma.flowStep.create({
      data: {
        flowId: newFlow.id,
        officeId: 1,
        sequenceOrder: 1
      }
    });
    console.log("Created step 1:", step1.id);

    const step2 = await prisma.flowStep.create({
      data: {
        flowId: newFlow.id,
        officeId: 2,
        sequenceOrder: 2
      }
    });
    console.log("Created step 2:", step2.id);

    // Let's add a prerequisite between them
    const prereq = await prisma.flowStepPrerequisite.create({
      data: {
        stepId: step2.id,
        prerequisiteStepId: step1.id
      }
    });
    console.log("Created prerequisite between step 2 and step 1");

    // Now let's try to delete the flow steps (this mimics the saving logic)
    console.log("Attempting to delete flow steps for flow:", newFlow.id);
    await prisma.flowStep.deleteMany({
      where: { flowId: newFlow.id }
    });
    console.log("Successfully deleted flow steps!");

    // Clean up the test flow
    await prisma.clearanceFlow.delete({ where: { id: newFlow.id } });
    console.log("Cleaned up test flow.");

  } catch (err) {
    console.error("ERROR ENCOUNTERED:", err);
  } finally {
    await prisma.$disconnect();
  }
}

run();
