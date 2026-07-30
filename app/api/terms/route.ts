import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET() {
  try {
    const terms = await prisma.academicTerm.findMany({
      orderBy: { createdAt: "desc" },
    });
    return NextResponse.json(terms);
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

      return await tx.academicTerm.create({
        data: {
          name,
          status: status || "Active",
        },
      });
    });

    return NextResponse.json(result);
  } catch (err) {
    console.error("[POST /api/terms]", err);
    return NextResponse.json({ error: "Database error" }, { status: 500 });
  }
}
