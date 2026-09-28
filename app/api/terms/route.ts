import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

function parseTermComponents(name?: string, academicYear?: string, semester?: string) {
  let ay = academicYear?.trim() || "";
  let sem = semester?.trim() || "";

  if (!ay || !sem) {
    if (name?.trim()) {
      const match = name.trim().match(/^(.*?)\s*(\d{4}-\d{4})$/);
      if (match) {
        sem = match[1].trim();
        ay = match[2].trim();
      } else {
        sem = name.trim();
        ay = "2025-2026";
      }
    } else {
      ay = "2025-2026";
      sem = "1st Semester";
    }
  }

  const yearMatch = ay ? ay.match(/(\d{4})-(\d{4})/) : null;
  const startYear = yearMatch ? parseInt(yearMatch[1], 10) : 0;

  const lowerSem = sem ? sem.toLowerCase() : "";
  let semWeight = 0;
  if (lowerSem.includes("summer")) {
    semWeight = 3;
  } else if (lowerSem.includes("2nd") || lowerSem.includes("second")) {
    semWeight = 2;
  } else if (lowerSem.includes("1st") || lowerSem.includes("first")) {
    semWeight = 1;
  }

  return { academicYear: ay, semester: sem, startYear, semWeight };
}

export async function GET() {
  try {
    const terms = await prisma.academicTerm.findMany();

    if (!Array.isArray(terms)) {
      return NextResponse.json([]);
    }

    // Sort terms descending: present/future years first, then semesters descending (Summer > 2nd > 1st)
    const sortedTerms = terms
      .map((t) => ({
        id: t.id,
        academicYear: t.academicYear || "2025-2026",
        semester: t.semester || "1st Semester",
        status: t.status || "Archived",
        createdAt: t.createdAt,
        name: `${t.semester || "1st Semester"} ${t.academicYear || "2025-2026"}`,
      }))
      .sort((a, b) => {
        const termA = parseTermComponents(undefined, a.academicYear, a.semester);
        const termB = parseTermComponents(undefined, b.academicYear, b.semester);

        if (termA.startYear !== termB.startYear) {
          return termB.startYear - termA.startYear;
        }
        return termB.semWeight - termA.semWeight;
      });

    return NextResponse.json(sortedTerms);
  } catch (err: any) {
    console.error("[GET /api/terms] Error:", err);
    return NextResponse.json({ error: err?.message || "Database error" }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { name, academicYear, semester, status } = body;

    const parsed = parseTermComponents(name, academicYear, semester);

    // Transaction to handle uniqueness of active term
    const result = await prisma.$transaction(async (tx) => {
      if (status === "Active") {
        await tx.academicTerm.updateMany({
          where: { status: "Active" },
          data: { status: "Archived" },
        });
      }

      const term = await tx.academicTerm.upsert({
        where: {
          academicYear_semester: {
            academicYear: parsed.academicYear,
            semester: parsed.semester,
          },
        },
        update: {
          status: status || "Active",
        },
        create: {
          academicYear: parsed.academicYear,
          semester: parsed.semester,
          status: status || "Active",
        },
      });

      // If the term was activated, unpublish flows in ALL OTHER terms
      if (term.status === "Active") {
        await tx.clearanceFlow.updateMany({
          where: {
            termId: { not: term.id },
            status: "Published",
          },
          data: { status: "Draft" },
        });
      } else {
        // If this term is Archived, demote all its flows to Draft
        await tx.clearanceFlow.updateMany({
          where: {
            termId: term.id,
            status: "Published",
          },
          data: { status: "Draft" },
        });
      }

      return {
        ...term,
        name: `${term.semester} ${term.academicYear}`,
      };
    });

    return NextResponse.json(result);
  } catch (err: any) {
    console.error("[POST /api/terms] Error:", err);
    return NextResponse.json({ error: err?.message || "Database error" }, { status: 500 });
  }
}

export async function DELETE(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const ay = searchParams.get("ay"); // e.g. "2026-2027"

    if (!ay) {
      return NextResponse.json({ error: "Academic year parameter 'ay' is required" }, { status: 400 });
    }

    // Find all terms that belong to this academic year
    const terms = await prisma.academicTerm.findMany({
      where: {
        academicYear: ay,
      },
    });

    const deletedIds: number[] = [];
    const skippedTerms: string[] = [];

    for (const term of terms) {
      // Check if referenced by ClearanceFlow or ClearanceRecord
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
        deletedIds.push(term.id);
      } else {
        skippedTerms.push(`${term.semester} ${term.academicYear}`);
      }
    }

    return NextResponse.json({
      success: true,
      deletedCount: deletedIds.length,
      skippedCount: skippedTerms.length,
      skippedTerms,
    });
  } catch (err: any) {
    console.error("[DELETE /api/terms] Error:", err);
    return NextResponse.json({ error: err?.message || "Database error" }, { status: 500 });
  }
}

export async function PATCH(req: NextRequest) {
  try {
    const { id, status } = await req.json();
    if (!id || !status) {
      return NextResponse.json({ error: "Term ID and Status are required" }, { status: 400 });
    }

    const result = await prisma.$transaction(async (tx) => {
      if (status === "Active") {
        await tx.academicTerm.updateMany({
          where: { status: "Active" },
          data: { status: "Archived" },
        });
      }

      const term = await tx.academicTerm.update({
        where: { id: Number(id) },
        data: { status },
      });

      if (term.status === "Active") {
        await tx.clearanceFlow.updateMany({
          where: {
            termId: { not: term.id },
            status: "Published",
          },
          data: { status: "Draft" },
        });
      } else {
        await tx.clearanceFlow.updateMany({
          where: {
            termId: term.id,
            status: "Published",
          },
          data: { status: "Draft" },
        });
      }

      return {
        ...term,
        name: `${term.semester} ${term.academicYear}`,
      };
    });

    return NextResponse.json(result);
  } catch (err: any) {
    console.error("[PATCH /api/terms] Error:", err);
    return NextResponse.json({ error: err?.message || "Database error" }, { status: 500 });
  }
}

