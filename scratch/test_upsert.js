const { PrismaClient } = require("@prisma/client");
const prisma = new PrismaClient();

async function run() {
  try {
    const student = await prisma.student.findFirst();
    if (!student) {
      console.log("No students found in DB!");
      return;
    }
    console.log("Found student ID:", student.id);

    console.log("Testing upsert with compound unique index containing NULL in where clause...");
    const res = await prisma.clearanceRecord.upsert({
      where: {
        studentId_officeId_termId: {
          studentId: student.id,
          officeId: 1,
          termId: null
        }
      },
      update: {
        status: "Pending"
      },
      create: {
        studentId: student.id,
        officeId: 1,
        termId: null,
        status: "Pending"
      }
    });
    console.log("Upsert succeeded!", res);
    
    // Clean up
    await prisma.clearanceRecord.delete({ where: { id: res.id } });
    console.log("Cleanup complete!");
  } catch (err) {
    console.error("UPSERT FAILED:", err);
  } finally {
    await prisma.$disconnect();
  }
}

run();
