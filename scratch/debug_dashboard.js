const { PrismaClient } = require("@prisma/client");
const prisma = new PrismaClient();

async function run() {
  try {
    const student = await prisma.student.findFirst();
    if (!student) {
      console.log("No student found");
      return;
    }
    console.log("Student:", student.id, student.name);

    // Call the API endpoint logic locally
    const activeTerm = await prisma.academicTerm.findFirst({ where: { status: "Active" } });
    const termId = activeTerm?.id || null;

    const flows = await prisma.clearanceFlow.findMany({
      where: { termId, status: "Published" },
      include: {
        steps: {
          include: { prerequisites: true }
        }
      }
    });

    console.log("Active Flows:", flows.map(f => ({ id: f.id, name: f.name })));
    for (const flow of flows) {
      console.log("Steps of Flow:", flow.name);
      for (const step of flow.steps) {
        console.log(`- Step ID: ${step.id}, officeId: ${step.officeId}, deptId: ${step.departmentId}, orgId: ${step.orgId}, isPrerequisiteOnly: ${step.isPrerequisiteOnly}, seq: ${step.sequenceOrder}`);
        console.log(`  Prerequisites:`, step.prerequisites.map(p => p.prerequisiteStepId));
      }
    }

  } catch (err) {
    console.error(err);
  } finally {
    await prisma.$disconnect();
  }
}

run();
