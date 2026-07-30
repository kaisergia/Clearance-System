import { NextResponse } from "next/server";
import { getSSCMasterlist, getSSCStudentById } from "@/services/sscIntegrationService";
import { prisma } from "@/lib/prisma";
import { getDepartmentForProgram } from "@/lib/constants";

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const studentId = searchParams.get("studentId");
    const sync = searchParams.get("sync") === "true";

    if (studentId) {
      const student = await getSSCStudentById(studentId, true);
      return NextResponse.json(student);
    }

    const masterlist = await getSSCMasterlist(true);

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

      return NextResponse.json({
        message: `Successfully synced ${syncedCount} students from SSC Masterlist.`,
        totalMasterlistCount: masterlist.length,
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
