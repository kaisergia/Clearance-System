/**
 * app/api/students/[id]/route.ts
 * GET /api/students/:id — returns a single student by ID, including avatarUrl from linked User
 */
import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const student = await prisma.student.findUnique({
      where: { id },
      include: {
        users: {
          select: { avatarUrl: true },
          take: 1,
        },
      },
    });
    if (!student) {
      return NextResponse.json({ error: "Student not found" }, { status: 404 });
    }
    // Flatten avatarUrl to top-level — take the first linked user's Google photo
    const { users, ...rest } = student;
    return NextResponse.json({ ...rest, avatarUrl: users[0]?.avatarUrl ?? null });
  } catch (err) {
    console.error("[GET /api/students/:id]", err);
    return NextResponse.json({ error: "Database error" }, { status: 500 });
  }
}
