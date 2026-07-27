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
      });

      if (!user) {
        return NextResponse.json({ error: "User not found" }, { status: 404 });
      }

      // Perform transaction
      await prisma.$transaction(async (tx) => {
        const studentIdInput = studentId.trim();
        const oldStudentId = user.studentId;

        // 1. Check if student record exists under studentIdInput or oldStudentId
        const targetId = studentIdInput;

        // Clean up old Student record if student ID was changed
        if (oldStudentId && oldStudentId !== studentIdInput) {
          const oldStudent = await tx.student.findUnique({ where: { id: oldStudentId } });
          if (oldStudent) {
            // Relink clearance records & org members to targetId
            await tx.clearanceRecord.updateMany({ where: { studentId: oldStudentId }, data: { studentId: targetId } });
            await tx.orgMember.updateMany({ where: { studentId: oldStudentId }, data: { studentId: targetId } });
            await tx.requirementSubmission.updateMany({ where: { studentId: oldStudentId }, data: { studentId: targetId } });
            await tx.student.delete({ where: { id: oldStudentId } });
          }
        }

        // 2. Upsert Student record in DB
        const existingStudent = await tx.student.findUnique({ where: { id: targetId } });
        if (existingStudent) {
          await tx.student.update({
            where: { id: targetId },
            data: {
              name: user.displayName || session.user.name || existingStudent.name,
              email: user.email,
              department: college,
              program,
              year: yearString,
            },
          });
        } else {
          await tx.student.create({
            data: {
              id: targetId,
              name: user.displayName || session.user.name || "Student User",
              email: user.email,
              department: college,
              program,
              year: yearString,
              status: "Pending",
              semester: "1st Semester 2025-2026",
            },
          });
        }

        // 3. Always link User to targetId in database
        await tx.user.update({
          where: { id: user.id },
          data: { studentId: targetId },
        });

        const activeStudentId = targetId;

        // Query names of selected organizations to save to StudentProfile.organization
        let organizationNamesString = null;
        if (Array.isArray(enrolledClubs) && enrolledClubs.length > 0) {
          const selectedOrgs = await tx.org.findMany({
            where: { id: { in: enrolledClubs } },
            select: { name: true },
          });
          organizationNamesString = selectedOrgs.map((o) => o.name).join(", ");
        }





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
