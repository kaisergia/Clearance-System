const { PrismaClient } = require("@prisma/client");
const prisma = new PrismaClient();

async function run() {
  try {
    const terms = await prisma.academicTerm.findMany();
    console.log("Academic Terms:", terms);

    const flows = await prisma.clearanceFlow.findMany({
      include: {
        steps: {
          include: {
            prerequisites: true
          }
        }
      }
    });
    console.log("Clearance Flows:", JSON.stringify(flows, null, 2));

    const students = await prisma.student.findMany();
    console.log("Total students:", students.length);

    const offices = await prisma.office.findMany();
    console.log("Offices:", offices.map(o => ({ id: o.id, name: o.name })));

    const depts = await prisma.department.findMany();
    console.log("Departments:", depts.map(d => ({ id: d.id, name: d.name, abbreviation: d.abbreviation })));

  } catch (err) {
    console.error(err);
  } finally {
    await prisma.$disconnect();
  }
}

run();
