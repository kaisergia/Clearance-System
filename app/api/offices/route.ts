/**
 * app/api/offices/route.ts
 * GET /api/offices — returns all offices from MySQL
 */
import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET() {
  try {
    const offices = await prisma.office.findMany({ orderBy: { name: "asc" } });
    return NextResponse.json(offices);
  } catch (err) {
    console.error("[GET /api/offices]", err);
    return NextResponse.json({ error: "Database error" }, { status: 500 });
  }
}
