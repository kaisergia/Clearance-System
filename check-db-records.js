const { PrismaClient } = require("@prisma/client");
const prisma = new PrismaClient();

async function main() {
  console.log('--- BEFORE CLEANUP ---');
  let reqs = await prisma.departmentRequirement.findMany({ where: { departmentId: 1 } });
  console.log(reqs.map(r => ({ id: r.id, name: r.name })));

  console.log('--- CLEANING DUPLICATES ---');
  await prisma.departmentRequirement.deleteMany({ where: { departmentId: 1 } });

  console.log('--- AFTER CLEANUP ---');
  reqs = await prisma.departmentRequirement.findMany({ where: { departmentId: 1 } });
  console.log(reqs);
}

main().catch(console.error).finally(() => prisma.$disconnect());
