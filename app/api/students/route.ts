/**
 * app/api/students/route.ts
 * GET /api/students — returns all students with avatarUrl from MySQL
 */
import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET() {
  try {
    const students = await prisma.student.findMany({
      include: {
        users: {
          select: {
            avatarUrl: true,
          },
        },
      },
      orderBy: { name: "asc" },
    });

    const formatted = students.map((s) => ({
      ...s,
      avatarUrl: s.users?.[0]?.avatarUrl || (s as any).avatarUrl || (s as any).avatar || (s as any).photoUrl || (s as any).profilePicture || null,
    }));

    return NextResponse.json(formatted);
  } catch (err) {
    console.error("[GET /api/students]", err);
    return NextResponse.json({ error: "Database error" }, { status: 500 });
  }
}
