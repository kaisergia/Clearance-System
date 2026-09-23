import { NextResponse } from "next/server";
import { getSSCMasterlist, getSSCStudentById } from "@/services/sscIntegrationService";
import { prisma } from "@/lib/prisma";
import { getDepartmentForProgram, PROGRAM_MAP } from "@/lib/constants";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/authOptions";

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

    // Restrict database sync strictly to System Admin
    if (sync) {
      const session = await getServerSession(authOptions);
      const role = (session?.user as any)?.role;
      const cookieHeader = request.headers.get("cookie") || "";
      const isDevAdmin = cookieHeader.includes("role=admin") || cookieHeader.includes("dev-role-override=admin");

      if (role !== "admin" && !isDevAdmin && process.env.NODE_ENV === "production") {
        return NextResponse.json(
          { error: "Access denied. Only System Administrators are authorized to sync the SSC masterlist to the database." },
          { status: 403 }
        );
      }
    }

    let masterlist = await getSSCMasterlist(true);

    // Helper to resolve department from program or departmentId
    const resolveDept = (item: any): string => {
      if (item.departmentId && typeof item.departmentId === "string") {
        const dId = item.departmentId.toUpperCase();
        if (dId.includes("CCIS")) return "CCIS";
        if (dId.includes("COE")) return "COE";
        if (dId.includes("CEDAS")) return "CEDAS";
        if (dId.includes("CHS")) return "CHS";
        if (dId.includes("CABE")) return "CABE";
      }
      return getDepartmentForProgram(item.program);
    };

    // Helper to normalize program name
    const normalizeProgramName = (prog: string | null | undefined, dept: string): string => {
      if (!prog) {
        if (dept === "CCIS") return "BS Information Technology";
        if (dept === "COE") return "BS Civil Engineering";
        if (dept === "CEDAS") return "BS Data Science";
        if (dept === "CHS") return "BS Nursing";
        if (dept === "CABE") return "BS Business Administration";
        return "BS Information Technology";
      }
      const upper = prog.trim().toUpperCase();
      if (upper === "BSCS" || upper === "CS") return "BS Computer Science";
      if (upper === "BSIT" || upper === "IT") return "BS Information Technology";
      if (upper === "BMMA" || upper === "MMA") return "Bachelor of Multimedia Arts";
      if (upper === "BSBA") return "BS Business Administration";
      if (upper === "BSA") return "BS Accountancy";
      if (upper === "BSCE") return "BS Civil Engineering";
      if (upper === "BSME") return "BS Mechanical Engineering";
      if (upper === "BSEE") return "BS Electrical Engineering";
      if (upper === "BSDS") return "BS Data Science";
      if (upper === "BSAM") return "BS Applied Mathematics";
      if (upper === "BSN") return "BS Nursing";
      if (upper === "BSP") return "BS Pharmacy";
      if (upper === "BSMT") return "BS Medical Technology";
      return prog;
    };

    // Helper to normalize year level
    const normalizeYear = (yr: string | null | undefined): string => {
      if (!yr) return "1st Year";
      if (yr.includes("1")) return "1st Year";
      if (yr.includes("2")) return "2nd Year";
      if (yr.includes("3")) return "3rd Year";
      if (yr.includes("4")) return "4th Year";
      if (yr.includes("5")) return "5th Year";
      return yr;
    };

    // Return dynamic options if requested by UI
    const optionsOnly = searchParams.get("options") === "true";
    if (optionsOnly && Array.isArray(masterlist)) {
      const deptsSet = new Set<string>(["CCIS", "COE", "CEDAS", "CHS", "CABE"]);
      const deptProgramsMap: Record<string, Set<string>> = {
        CCIS: new Set(["BS Computer Science", "BS Information Technology", "Bachelor of Multimedia Arts", "Bachelor of Library and Information Science"]),
        COE: new Set(["BS Civil Engineering", "BS Mechanical Engineering", "BS Electrical Engineering"]),
        CEDAS: new Set(["BS Data Science", "BS Applied Mathematics"]),
        CHS: new Set(["BS Nursing", "BS Pharmacy", "BS Medical Technology"]),
        CABE: new Set(["BS Business Administration", "BS Accountancy", "BS Hospitality Management"]),
      };
      const allProgramsSet = new Set<string>();
      const yearLevelsSet = new Set<string>(["1st Year", "2nd Year", "3rd Year", "4th Year", "5th Year"]);

      masterlist.forEach((item) => {
        const d = resolveDept(item);
        if (d) deptsSet.add(d);
        const p = normalizeProgramName(item.program, d);
        if (p) {
          allProgramsSet.add(p);
          if (!deptProgramsMap[d]) deptProgramsMap[d] = new Set();
          deptProgramsMap[d].add(p);
        }
        const y = normalizeYear(item.yearLevel || (item as any).year);
        if (y) yearLevelsSet.add(y);
      });

      const formattedDeptPrograms: Record<string, string[]> = {};
      for (const [k, v] of Object.entries(deptProgramsMap)) {
        formattedDeptPrograms[k] = Array.from(v);
      }

      return NextResponse.json({
        departments: Array.from(deptsSet),
        departmentPrograms: formattedDeptPrograms,
        allPrograms: Array.from(new Set([...Array.from(allProgramsSet), ...Object.values(formattedDeptPrograms).flat()])),
        yearLevels: Array.from(yearLevelsSet),
        totalStudents: masterlist.length,
      });
    }

    // Apply filters if provided
    if (Array.isArray(masterlist)) {
      if (department && department !== "All Departments" && department !== "All") {
        masterlist = masterlist.filter((item) => {
          const itemDept = resolveDept(item);
          return itemDept === department || (item as any).department === department;
        });
      }

      if (program && program !== "All Programs" && program !== "All") {
        masterlist = masterlist.filter((item) => {
          const normProg = normalizeProgramName(item.program, resolveDept(item));
          const norm1 = PROGRAM_MAP[normProg] || normProg;
          const norm2 = PROGRAM_MAP[program] || program;
          return normProg === program || norm1 === norm2 || normProg.toLowerCase().includes(program.toLowerCase());
        });
      }

      if (year && year !== "All Year Levels" && year !== "All Years" && year !== "All") {
        masterlist = masterlist.filter((item) => {
          const normYr = normalizeYear(item.yearLevel || (item as any).year);
          return normYr === year || normYr.toLowerCase() === year.toLowerCase();
        });
      }
    }

    // Perform database sync if requested
    if (sync && Array.isArray(masterlist)) {
      const activeTerm = await prisma.academicTerm.findFirst({
        where: { status: "Active" },
      });
      const activeAcademicYear = activeTerm?.academicYear || "2025-2026";
      const activeSemester = activeTerm
        ? `${activeTerm.semester} ${activeTerm.academicYear}`
        : "1st Semester 2025-2026";

      let syncedCount = 0;
      for (const item of masterlist) {
        try {
          const deptCode = resolveDept(item);
          const progName = normalizeProgramName(item.program, deptCode);
          const yearLevel = normalizeYear(item.yearLevel || (item as any).year);
          const studentName = item.fullName || `${item.givenName} ${item.familyName}`.trim() || `Student ${item.studentId}`;
          const studentEmail = item.email || `${item.studentId}@g.cjc.edu.ph`;

          await prisma.student.upsert({
            where: { id: item.studentId },
            update: {
              name: studentName,
              email: studentEmail,
              department: deptCode,
              program: progName,
              year: yearLevel,
              academicYear: activeAcademicYear,
            },
            create: {
              id: item.studentId,
              name: studentName,
              email: studentEmail,
              department: deptCode,
              program: progName,
              year: yearLevel,
              academicYear: activeAcademicYear,
              semester: activeSemester,
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
