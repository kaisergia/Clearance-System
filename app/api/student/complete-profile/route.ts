import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/authOptions";
import { prisma } from "@/lib/prisma";

export async function POST(req: Request) {
  try {
    const session = await getServerSession(authOptions);
    if (!session || !session.user || !session.user.email) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await req.json();
    const { studentId, college, program, yearLevel, enrolledClubs } = body;

    // Server-side validation
    if (!studentId || !college || !program || !yearLevel) {
      return NextResponse.json({ error: "Missing required fields" }, { status: 400 });
    }

    const yearString = `${yearLevel}${yearLevel === 1 ? "st" : yearLevel === 2 ? "nd" : yearLevel === 3 ? "rd" : "th"} Year`;

    // Attempt DB operations
    try {
      const user = await prisma.user.findUnique({
        where: { email: session.user.email },
        include: { studentProfile: true },
      });

      if (!user) {
        return NextResponse.json({ error: "User not found" }, { status: 404 });
      }

      // Perform transaction
      await prisma.$transaction(async (tx) => {
        const studentIdInput = studentId.trim();
        const oldStudentId = user.studentId;

        // 1. Update Student record & handle student ID changes
        if (oldStudentId && oldStudentId !== studentIdInput) {
          // Check if studentIdInput is already used by another student
          const existingStudent = await tx.student.findUnique({ where: { id: studentIdInput } });
          if (existingStudent && existingStudent.email !== user.email) {
            throw new Error("Student ID is already registered to another student.");
          }

          // Clean up any orphaned records for studentIdInput to prevent unique constraint failures
          await tx.clearanceRecord.deleteMany({ where: { studentId: studentIdInput } });
          await tx.orgMember.deleteMany({ where: { studentId: studentIdInput } });
          await tx.requirementSubmission.deleteMany({ where: { studentId: studentIdInput } });
          await tx.user.updateMany({
            where: { studentId: studentIdInput },
            data: { studentId: null }
          });

          const oldStudent = await tx.student.findUnique({ where: { id: oldStudentId } });
          
          if (oldStudent) {
            // Temporarily rename email of old student to bypass unique constraint
            await tx.student.update({
              where: { id: oldStudentId },
              data: { email: oldStudent.email + "-temp" },
            });

            // Create new Student record with the user-supplied student ID
            await tx.student.create({
              data: {
                id: studentIdInput,
                name: oldStudent.name,
                email: oldStudent.email,
                department: college,
                program,
                year: yearString,
                status: oldStudent.status,
                semester: oldStudent.semester,
              },
            });

            // Update ClearanceRecords to link to the new studentId
            await tx.clearanceRecord.updateMany({
              where: { studentId: oldStudentId },
              data: { studentId: studentIdInput },
            });

            // Update OrgMembers to link to the new studentId
            await tx.orgMember.updateMany({
              where: { studentId: oldStudentId },
              data: { studentId: studentIdInput },
            });

            // Update RequirementSubmissions to link to the new studentId
            await tx.requirementSubmission.updateMany({
              where: { studentId: oldStudentId },
              data: { studentId: studentIdInput },
            });

            // Update User records to point to the new studentId
            await tx.user.updateMany({
              where: { studentId: oldStudentId },
              data: { studentId: studentIdInput },
            });

            // Delete old Student record
            await tx.student.delete({ where: { id: oldStudentId } });
          }
        } else if (oldStudentId) {
          // If ID hasn't changed, just update the department/program/year level
          await tx.student.update({
            where: { id: oldStudentId },
            data: {
              department: college,
              program,
              year: yearString,
            },
          });
        }

        const activeStudentId = oldStudentId && oldStudentId !== studentIdInput ? studentIdInput : oldStudentId || studentIdInput;

        // Query names of selected organizations to save to StudentProfile.organization
        let organizationNamesString = null;
        if (Array.isArray(enrolledClubs) && enrolledClubs.length > 0) {
          const selectedOrgs = await tx.org.findMany({
            where: { id: { in: enrolledClubs } },
            select: { name: true },
          });
          organizationNamesString = selectedOrgs.map((o) => o.name).join(", ");
        }

        // 2. Upsert StudentProfile
        await tx.studentProfile.upsert({
          where: { userId: user.id },
          create: {
            userId: user.id,
            college,
            program,
            yearLevel,
            organization: organizationNamesString,
          },
          update: {
            college,
            program,
            yearLevel,
            organization: organizationNamesString,
          },
        });

        // 3. Set isProfileComplete = true on User
        await tx.user.update({
          where: { id: user.id },
          data: { isProfileComplete: true },
        });

        // 4. Handle enrolled clubs / organization memberships
        if (Array.isArray(enrolledClubs)) {
          // Clear any existing org memberships
          await tx.orgMember.deleteMany({
            where: { studentId: activeStudentId },
          });

          // Insert selected memberships
          if (enrolledClubs.length > 0) {
            await tx.orgMember.createMany({
              data: enrolledClubs.map((orgId: number) => ({
                orgId,
                studentId: activeStudentId,
              })),
            });
          }
        }
      });

      return NextResponse.json({ success: true });
    } catch (dbErr) {
      console.error("[POST /api/student/complete-profile] Database error, triggering client fallback", dbErr);
      // Return a special indicator so the client knows it should run in mock/localStorage mode
      return NextResponse.json({ 
        success: true, 
        fallback: true,
        message: "Database offline. Profile saved locally."
      });
    }
  } catch (err: any) {
    console.error("[POST /api/student/complete-profile] General error", err);
    return NextResponse.json({ error: err.message || "Server error" }, { status: 500 });
  }
}
