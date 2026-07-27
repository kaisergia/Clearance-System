import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { mockStudents } from "@/mock/mockStudents";
import { mockRequirements, mockStudentClearanceRecords } from "@/mock/mockData";

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ code: string }> | { code: string } }
) {
  try {
    const resolvedParams = await Promise.resolve(params);
    const rawCode = decodeURIComponent(resolvedParams.code || "");
    const cleanCode = rawCode.trim().toUpperCase();

    // Extract student ID from code formats: CJC-CLR-2026-2021-0492, CJC-2021-0492, or direct 2021-0492
    let studentIdMatch = cleanCode;
    if (cleanCode.startsWith("CJC-CLR-2026-")) {
      studentIdMatch = cleanCode.replace("CJC-CLR-2026-", "");
    } else if (cleanCode.startsWith("CJC-")) {
      studentIdMatch = cleanCode.replace("CJC-", "");
    }

    let studentData: any = null;
    let recordsData: any[] = [];

    try {
      // 1. Try finding in Prisma DB
      const dbStudent = await prisma.student.findFirst({
        where: {
          OR: [
            { id: { equals: studentIdMatch, mode: "insensitive" } },
            { id: { equals: cleanCode, mode: "insensitive" } },
            { email: { equals: cleanCode.toLowerCase(), mode: "insensitive" } },
          ],
        },
        include: {
          clearanceRecords: true,
        },
      });

      if (dbStudent) {
        studentData = {
          id: dbStudent.id,
          name: dbStudent.name,
          email: dbStudent.email,
          department: dbStudent.department,
          program: dbStudent.program,
          year: dbStudent.year,
          status: dbStudent.status,
          semester: dbStudent.semester || "1st Semester 2025-2026",
        };
        recordsData = dbStudent.clearanceRecords || [];
      } else {
        // Try finding user by email or studentId
        const dbUser = await prisma.user.findFirst({
          where: {
            OR: [
              { email: { equals: cleanCode.toLowerCase(), mode: "insensitive" } },
              { studentId: { equals: studentIdMatch, mode: "insensitive" } },
            ],
          },
          include: { student: { include: { clearanceRecords: true } } },
        });

        if (dbUser && dbUser.student) {
          studentData = {
            id: dbUser.student.id,
            name: dbUser.displayName || dbUser.student.name,
            email: dbUser.email,
            department: dbUser.student.department,
            program: dbUser.student.program,
            year: dbUser.student.year,
            status: dbUser.student.status,
            semester: dbUser.student.semester || "1st Semester 2025-2026",
          };
          recordsData = dbUser.student.clearanceRecords || [];
        }
      }
    } catch (dbErr) {
      console.warn("[Verify API] Database query failed, using fallback records", dbErr);
    }

    // 2. Fallback lookup if not found in database yet
    if (!studentData) {
      const mockMatch = mockStudents.find(
        (s) =>
          s.id.toUpperCase() === studentIdMatch ||
          s.id.toUpperCase() === cleanCode ||
          s.email.toLowerCase() === cleanCode.toLowerCase()
      );

      if (mockMatch) {
        studentData = {
          id: mockMatch.id,
          name: mockMatch.name,
          email: mockMatch.email,
          department: mockMatch.department,
          program: mockMatch.program,
          year: mockMatch.year,
          status: mockMatch.status,
          semester: mockMatch.semester || "1st Semester 2025-2026",
        };
        
        // Mock clearance records summary
        const studentRecordsMap = mockStudentClearanceRecords[mockMatch.id] || {};
        recordsData = mockRequirements.map((r) => ({
          entityId: r.id,
          entityType: r.type,
          status: studentRecordsMap[r.id]?.status || "Pending",
          dateCleared: studentRecordsMap[r.id]?.dateCleared || null,
        }));
      }
    }

    if (!studentData) {
      return NextResponse.json(
        {
          valid: false,
          error: `No clearance record found matching '${cleanCode}'. Please verify the Student ID or Verification Code.`,
        },
        { status: 404 }
      );
    }

    // Evaluate clearance status
    const totalRecords = recordsData.length;
    const clearedRecords = recordsData.filter((r) => r.status === "Cleared").length;
    const isFullyCleared = studentData.status === "Cleared" || (totalRecords > 0 && clearedRecords === totalRecords);

    const formattedCode = `CJC-CLR-2026-${studentData.id}`;
    const dateCleared = recordsData.find((r) => r.dateCleared)?.dateCleared || "July 2026";

    return NextResponse.json({
      valid: isFullyCleared,
      status: isFullyCleared ? "Cleared" : "Pending",
      verificationCode: formattedCode,
      issuedDate: dateCleared,
      student: studentData,
      clearanceSummary: {
        total: totalRecords,
        cleared: clearedRecords,
        isFullyCleared,
      },
      records: recordsData,
    });
  } catch (err: any) {
    console.error("[GET /api/verify/[code]] Error", err);
    return NextResponse.json(
      { valid: false, error: err?.message || "Verification server error" },
      { status: 500 }
    );
  }
}
