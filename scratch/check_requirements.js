const { PrismaClient } = require("@prisma/client");
const prisma = new PrismaClient();

async function run() {
  try {
    const officeReqs = await prisma.officeRequirement.findMany();
    const deptReqs = await prisma.departmentRequirement.findMany();
    const orgReqs = await prisma.orgRequirement.findMany();

    console.log("Office Reqs:", officeReqs.map(r => ({ id: r.id, name: r.name, termId: r.termId })));
    console.log("Dept Reqs:", deptReqs.map(r => ({ id: r.id, name: r.name, termId: r.termId })));
    console.log("Org Reqs:", orgReqs.map(r => ({ id: r.id, name: r.name, termId: r.termId })));
  } catch (err) {
    console.error(err);
  } finally {
    await prisma.$disconnect();
  }
}

run();
