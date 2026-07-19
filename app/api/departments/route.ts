/**
 * app/api/departments/route.ts
 * GET /api/departments — returns all departments from MySQL
 */
import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET() {
  try {
    const departments = await prisma.department.findMany({ orderBy: { name: "asc" } });
    return NextResponse.json(departments);
  } catch (err) {
    console.error("[GET /api/departments]", err);
    return NextResponse.json({ error: "Database error" }, { status: 500 });
  }
}
