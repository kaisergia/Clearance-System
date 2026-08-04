import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

function parseTermName(name: string) {
  const yearMatch = name.match(/(\d{4})-(\d{4})/);
  const startYear = yearMatch ? parseInt(yearMatch[1], 10) : 0;

  const lowerName = name.toLowerCase();
  let semWeight = 0;
  if (lowerName.includes("summer")) {
    semWeight = 3;
  } else if (lowerName.includes("2nd") || lowerName.includes("second")) {
    semWeight = 2;
  } else if (lowerName.includes("1st") || lowerName.includes("first")) {
    semWeight = 1;
  }

  return { startYear, semWeight };
}

export async function GET() {
  try {
    const terms = await prisma.academicTerm.findMany();
    
    // Sort terms descending: present/future years first, then semesters descending (Summer > 2nd > 1st)
    const sortedTerms = terms.sort((a, b) => {
      const termA = parseTermName(a.name);
      const termB = parseTermName(b.name);

      if (termA.startYear !== termB.startYear) {
        return termB.startYear - termA.startYear;
      }
      return termB.semWeight - termA.semWeight;
    });

    return NextResponse.json(sortedTerms);
  } catch (err) {
    console.error("[GET /api/terms]", err);
    return NextResponse.json({ error: "Database error" }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const { name, status } = await req.json();

    if (!name) {
      return NextResponse.json({ error: "Term name is required" }, { status: 400 });
    }

    // Transaction to handle uniqueness of active term
    const result = await prisma.$transaction(async (tx) => {
      if (status === "Active") {
        await tx.academicTerm.updateMany({
          where: { status: "Active" },
          data: { status: "Archived" },
        });
      }

      let term;
      const existing = await tx.academicTerm.findUnique({
        where: { name },
      });

      if (existing) {
        term = await tx.academicTerm.update({
          where: { id: existing.id },
          data: {
            status: status || "Active",
          },
        });
      } else {
        term = await tx.academicTerm.create({
          data: {
            name,
            status: status || "Active",
          },
        });
      }

      // If the term was activated, unpublish flows in ALL OTHER terms
      if (term.status === "Active") {
        await tx.clearanceFlow.updateMany({
          where: {
            termId: { not: term.id },
            status: "Published",
          },
          data: { status: "Draft" },
        });
      }

      return term;
    });

    return NextResponse.json(result);
  } catch (err) {
    console.error("[POST /api/terms]", err);
    return NextResponse.json({ error: "Database error" }, { status: 500 });
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
        name: {
          contains: ay,
        },
      },
    });

    const deletedIds: number[] = [];
    const skippedNames: string[] = [];

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
        skippedNames.push(term.name);
      }
    }

    return NextResponse.json({
      success: true,
      deletedCount: deletedIds.length,
      skippedCount: skippedNames.length,
      skippedTerms: skippedNames,
    });
  } catch (err) {
    console.error("[DELETE /api/terms]", err);
    return NextResponse.json({ error: "Database error" }, { status: 500 });
  }
}

