const { PrismaClient } = require("@prisma/client");
const prisma = new PrismaClient();

async function run() {
  try {
    const activeTerm = await prisma.academicTerm.findFirst({
      where: { status: "Active" }
    });
    if (!activeTerm) {
      console.log("No active term found");
      return;
    }

    // Let's create a draft flow with steps
    console.log("Creating test flow...");
    const flow = await prisma.clearanceFlow.create({
      data: {
        name: "Test Sync Flow",
        description: "Checking student record sync logic",
        termId: activeTerm.id,
        status: "Published", // Trigger sync
        targetCriteria: { years: ["4th Year"], departments: ["CCIS"] }
      }
    });

    const step = await prisma.flowStep.create({
      data: {
        flowId: flow.id,
        officeId: 1,
        sequenceOrder: 1
      }
    });

    console.log("Running syncStudentClearanceRecords simulation...");
    // Simulating:
    await prisma.$transaction(async (tx) => {
      const flowFetched = await tx.clearanceFlow.findUnique({
        where: { id: flow.id },
        include: { steps: true, term: true },
      });
      console.log("Flow fetched, status:", flowFetched.status, "termId:", flowFetched.termId);

      let criteria = {};
      if (typeof flowFetched.targetCriteria === "string") {
        criteria = JSON.parse(flowFetched.targetCriteria);
      } else if (flowFetched.targetCriteria && typeof flowFetched.targetCriteria === "object") {
        criteria = flowFetched.targetCriteria;
      }
      console.log("CriteriaParsed:", criteria);

      const whereClause = {};
      if (criteria.years && criteria.years.length > 0) {
        whereClause.year = { in: criteria.years };
      }
      if (criteria.departments && criteria.departments.length > 0) {
        whereClause.department = { in: criteria.departments };
      }
      const students = await tx.student.findMany({ where: whereClause });
      console.log("Students matching criteria:", students.map(s => s.id));

      const officeReqs = await tx.officeRequirement.findMany({
        where: { termId: flowFetched.termId },
        select: { id: true },
      });
      const deptReqs = await tx.departmentRequirement.findMany({
        where: { termId: flowFetched.termId },
        select: { id: true },
      });
      const orgReqs = await tx.orgRequirement.findMany({
        where: { termId: flowFetched.termId },
        select: { id: true },
      });

      const termReqIds = [
        ...officeReqs.map(r => r.id),
        ...deptReqs.map(r => r.id),
        ...orgReqs.map(r => r.id),
      ];
      console.log("Term requirements:", termReqIds);

      if (termReqIds.length > 0 && students.length > 0) {
        await tx.requirementSubmission.deleteMany({
          where: {
            studentId: { in: students.map(s => s.id) },
            requirementId: { in: termReqIds },
          },
        });
      }

      for (const student of students) {
        for (const step of flowFetched.steps) {
          let recordsToCreate = [];

          if (step.officeId) {
            recordsToCreate.push({ officeId: step.officeId });
          } else if (step.departmentId) {
            recordsToCreate.push({ departmentId: step.departmentId });
          } else if (step.orgId) {
            recordsToCreate.push({ orgId: step.orgId });
          }

          console.log("For student", student.id, "records to create:", recordsToCreate);
          for (const item of recordsToCreate) {
            let actualWhereClause = null;
            if (item.officeId) {
              actualWhereClause = { studentId_officeId_termId: { studentId: student.id, officeId: item.officeId, termId: flowFetched.termId } };
            } else if (item.orgId) {
              actualWhereClause = { studentId_orgId_termId: { studentId: student.id, orgId: item.orgId, termId: flowFetched.termId } };
            } else if (item.departmentId) {
              actualWhereClause = { studentId_departmentId_termId: { studentId: student.id, departmentId: item.departmentId, termId: flowFetched.termId } };
            }

            console.log("upsert actualWhereClause:", actualWhereClause);
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
                  termId: flowFetched.termId,
                  status: "Pending",
                  ...item,
                },
              });
            }
          }
        }
      }
    });

    console.log("Sync simulated successfully!");

    // Clean up
    await prisma.clearanceFlow.delete({ where: { id: flow.id } });
    console.log("Test flow cleaned up.");

  } catch (err) {
    console.error("SYNC SIMULATION FAILED:", err);
  } finally {
    await prisma.$disconnect();
  }
}

run();
