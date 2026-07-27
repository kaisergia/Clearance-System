/**
 * app/api/orgs/route.ts
 * GET /api/orgs — returns all organisations from MySQL
 */
import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET() {
  try {
    const orgs = await prisma.org.findMany({ orderBy: { name: "asc" } });
    return NextResponse.json(orgs);
  } catch (err) {
    console.error("[GET /api/orgs]", err);
    return NextResponse.json({ error: "Database error" }, { status: 500 });
  }
}

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const { name, type, category, department, program, adviser } = body;

    if (!name || !type) {
      return NextResponse.json({ error: "Name and Type are required." }, { status: 400 });
    }

    const newOrg = await prisma.org.create({
      data: {
        name,
        type, // Gov | LGU | AcademicClub | NonAcademicClub
        category: category || (type === "Gov" || type === "LGU" ? "Governance" : type === "AcademicClub" ? "Academic" : "Non-Academic"),
        department: type === "Gov" ? null : (department || null),
        program: program || null,
        adviser: adviser || null,
        status: "Active",
        dateAdded: new Date().toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" }),
      },
    });

    return NextResponse.json(newOrg, { status: 201 });
  } catch (err) {
    console.error("[POST /api/orgs]", err);
    return NextResponse.json({ error: "Failed to create organization" }, { status: 500 });
  }
}
