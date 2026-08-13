import { NextResponse } from "next/server";
import { getSSCMasterlist, getSSCStudentById } from "@/services/sscIntegrationService";
import { prisma } from "@/lib/prisma";
import { getDepartmentForProgram, PROGRAM_MAP } from "@/lib/constants";

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const studentId = searchParams.get("studentId");
    const sync = searchParams.get("sync") === "true";
    const department = searchParams.get("department");
    const program = searchParams.get("program");
    const year = searchParams.get("year");

    if (studentId) {
      const student = await getSSCStudentById(studentId, true);
      return NextResponse.json(student);
    }

    let masterlist = await getSSCMasterlist(true);

    // Apply filters if provided
    if (Array.isArray(masterlist)) {
      if (department && department !== "All Departments" && department !== "All") {
        masterlist = masterlist.filter((item) => {
          const itemDept = getDepartmentForProgram(item.program);
          return itemDept === department || (item as any).department === department;
        });
      }

      if (program && program !== "All Programs" && program !== "All") {
        masterlist = masterlist.filter((item) => {
          if (!item.program) return false;
          const norm1 = PROGRAM_MAP[item.program] || item.program;
          const norm2 = PROGRAM_MAP[program] || program;
          return item.program === program || norm1 === norm2 || item.program.toLowerCase().includes(program.toLowerCase());
        });
      }

      if (year && year !== "All Year Levels" && year !== "All Years" && year !== "All") {
        masterlist = masterlist.filter((item) => {
          return item.yearLevel === year || (item as any).year === year || (item as any).yearLevel?.toLowerCase() === year.toLowerCase();
        });
      }
    }

    // Perform database sync if requested
    if (sync && Array.isArray(masterlist)) {
      let syncedCount = 0;
      for (const item of masterlist) {
        try {
          const progName = item.program || "BSIT";
          const deptCode = getDepartmentForProgram(progName);
          await prisma.student.upsert({
            where: { id: item.studentId },
            update: {
              name: item.fullName || `${item.givenName} ${item.familyName}`,
              email: item.email,
              department: deptCode,
              program: progName,
              year: item.yearLevel || "1st Year",
            },
            create: {
              id: item.studentId,
              name: item.fullName || `${item.givenName} ${item.familyName}`,
              email: item.email,
              department: deptCode,
              program: progName,
              year: item.yearLevel || "1st Year",
              semester: "1st Semester 2025-2026",
              status: "Pending",
            },
          });
          syncedCount++;
        } catch (dbErr) {
          console.error(`Failed to sync student ${item.studentId}:`, dbErr);
        }
      }

      const filterSummary = [
        department && department !== "All Departments" ? `Dept: ${department}` : null,
        program && program !== "All Programs" ? `Prog: ${program}` : null,
        year && year !== "All Year Levels" ? `Year: ${year}` : null,
      ]
        .filter(Boolean)
        .join(", ");

      return NextResponse.json({
        message: `Successfully synced ${syncedCount} students from SSC Masterlist${filterSummary ? ` (${filterSummary})` : ""}.`,
        totalFilteredCount: masterlist.length,
        syncedCount,
        masterlist,
      });
    }

    return NextResponse.json(masterlist);
  } catch (err: any) {
    console.error("SSC Masterlist Integration Route error:", err);
    return NextResponse.json(
      { error: err.message || "Failed to fetch from SSC Masterlist" },
      { status: 500 }
    );
  }
}
