/**
 * app/api/offices/route.ts
 * GET /api/offices — returns all offices with linked headUser profile & logoUrl
 */
import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET() {
  try {
    const offices = await prisma.office.findMany({
      include: {
        users: {
          select: {
            id: true,
            displayName: true,
            email: true,
            avatarUrl: true,
            role: true,
          },
        },
      },
      orderBy: { name: "asc" },
    });

    const formatted = offices.map((o) => {
      const headUser = o.users?.find((u) => u.role === "head_office") || o.users?.[0];
      return {
        ...o,
        headUser: headUser
          ? {
              name: headUser.displayName || o.head,
              email: headUser.email || o.email,
              avatarUrl: headUser.avatarUrl || null,
            }
          : {
              name: o.head,
              email: o.email,
              avatarUrl: null,
            },
      };
    });

    return NextResponse.json(formatted);
  } catch (err) {
    console.error("[GET /api/offices]", err);
    return NextResponse.json({ error: "Database error" }, { status: 500 });
  }
}
