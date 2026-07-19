/**
 * app/api/students/route.ts
 * GET /api/students — returns all students from MySQL
 */
import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET() {
  try {
    const students = await prisma.student.findMany({
      orderBy: { name: "asc" },
    });
    return NextResponse.json(students);
  } catch (err) {
    console.error("[GET /api/students]", err);
    return NextResponse.json({ error: "Database error" }, { status: 500 });
  }
}
