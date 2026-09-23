import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET() {
  try {
    const terms = await prisma.academicTerm.findMany({
      orderBy: [
        { academicYear: "desc" },
        { semester: "asc" },
      ],
    });

    const yearMap = new Map<string, { year: string; status: string; terms: any[] }>();

    terms.forEach((t) => {
      const termObj = {
        ...t,
        name: `${t.semester} ${t.academicYear}`,
      };

      if (!yearMap.has(t.academicYear)) {
        yearMap.set(t.academicYear, {
          year: t.academicYear,
          status: t.status === "Active" ? "Active" : "Archived",
          terms: [],
        });
      }

      const entry = yearMap.get(t.academicYear)!;
      if (t.status === "Active") {
        entry.status = "Active";
      }
      entry.terms.push(termObj);
    });

    const academicYears = Array.from(yearMap.values()).sort((a, b) =>
      b.year.localeCompare(a.year)
    );

    return NextResponse.json(academicYears);
  } catch (err) {
    console.error("[GET /api/academic-years]", err);
    return NextResponse.json({ error: "Database error" }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const { year, status } = await req.json();

    if (!year || typeof year !== "string") {
      return NextResponse.json(
        { error: "Academic year is required (e.g., 2025-2026)" },
        { status: 400 }
      );
    }

    const trimmedYear = year.trim();
    const ayPattern = /^\d{4}-\d{4}$/;
    if (!ayPattern.test(trimmedYear)) {
      return NextResponse.json(
        { error: "Invalid academic year format. Use YYYY-YYYY (e.g., 2025-2026)." },
        { status: 400 }
      );
    }

    // Seed standard terms in academicTerm table
    const standardSemesters = ["1st Semester", "2nd Semester", "Summer"];
    const createdTerms = [];

    for (const sem of standardSemesters) {
      const term = await prisma.academicTerm.upsert({
        where: {
          academicYear_semester: {
            academicYear: trimmedYear,
            semester: sem,
          },
        },
        update: {},
        create: {
          academicYear: trimmedYear,
          semester: sem,
          status: status || "Archived",
        },
      });

      createdTerms.push({
        ...term,
        name: `${term.semester} ${term.academicYear}`,
      });
    }

    return NextResponse.json({
      year: trimmedYear,
      status: status || "Archived",
      terms: createdTerms,
    });
  } catch (err) {
    console.error("[POST /api/academic-years]", err);
    return NextResponse.json({ error: "Database error" }, { status: 500 });
  }
}

export async function DELETE(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const year = searchParams.get("year");

    if (!year) {
      return NextResponse.json(
        { error: "Academic year parameter 'year' is required" },
        { status: 400 }
      );
    }

    // Check if any term under this academic year is attached to clearance flows or records
    const terms = await prisma.academicTerm.findMany({
      where: {
        academicYear: year,
      },
    });

    const deletedTermIds: number[] = [];
    const skippedTerms: string[] = [];

    for (const term of terms) {
      const flowCount = await prisma.clearanceFlow.count({
        where: { termId: term.id },
      });
      const recordCount = await prisma.clearanceRecord.count({
        where: { termId: term.id },
      });

      if (flowCount === 0 && recordCount === 0) {
        await prisma.academicTerm.delete({
          where: { id: term.id },
        });
        deletedTermIds.push(term.id);
      } else {
        skippedTerms.push(`${term.semester} ${term.academicYear}`);
      }
    }

    return NextResponse.json({
      success: true,
      deletedTermIds,
      skippedTerms,
    });
  } catch (err) {
    console.error("[DELETE /api/academic-years]", err);
    return NextResponse.json({ error: "Database error" }, { status: 500 });
  }
}
