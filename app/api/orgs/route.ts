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
