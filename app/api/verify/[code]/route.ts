import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET(
  req: NextRequest,
  { params }: { params: { code: string } }
) {
  try {
    const rawCode = params.code || "";
    const cleanCode = rawCode.trim().toUpperCase();

    // Extract student ID from code formats: CJC-CLR-2026-2021-0492, CJC-2021-0492, or direct 2021-0492
    let studentIdMatch = cleanCode;
    if (cleanCode.startsWith("CJC-CLR-2026-")) {
      studentIdMatch = cleanCode.replace("CJC-CLR-2026-", "");
    } else if (cleanCode.startsWith("CJC-")) {
      studentIdMatch = cleanCode.replace("CJC-", "");
    }

    // Try finding student by exact ID, email, or formatted code match
    const student = await prisma.student.findFirst({
      where: {
        OR: [
          { id: studentIdMatch },
          { id: cleanCode },
          { email: cleanCode.toLowerCase() },
        ],
      },
      include: {
        clearanceRecords: true,
      },
    });

    if (!student) {
      return NextResponse.json(
        {
          valid: false,
          error: "No clearance record found matching this verification code.",
        },
        { status: 404 }
      );
    }

    // Check if student has clearance records
    const records = student.clearanceRecords || [];
    const totalRecords = records.length;
    const clearedRecords = records.filter((r) => r.status === "Cleared").length;
    const isFullyCleared = totalRecords > 0 && clearedRecords === totalRecords;

    // Build requirement summary
    const recordSummary = records.map((r) => ({
      entityId: r.officeId || r.departmentId || r.orgId,
      entityType: r.officeId ? "office" : r.departmentId ? "department" : "org",
      status: r.status,
      dateCleared: r.dateCleared,
    }));

    const formattedCode = `CJC-CLR-2026-${student.id}`;
    const dateCleared = records.find((r) => r.dateCleared)?.dateCleared || "July 2026";

    return NextResponse.json({
      valid: isFullyCleared,
      status: student.status,
      verificationCode: formattedCode,
      issuedDate: dateCleared,
      student: {
        id: student.id,
        name: student.name,
        email: student.email,
        department: student.department,
        program: student.program,
        year: student.year,
        semester: student.semester || "1st Semester 2025-2026",
      },
      clearanceSummary: {
        total: totalRecords,
        cleared: clearedRecords,
        isFullyCleared,
      },
      records: recordSummary,
    });
  } catch (err: any) {
    console.error("[GET /api/verify/[code]] Error", err);
    return NextResponse.json(
      { valid: false, error: err?.message || "Verification server error" },
      { status: 500 }
    );
  }
}
