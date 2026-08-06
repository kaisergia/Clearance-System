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

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const { name, head, email, description } = body;

    if (!name || !head || !email) {
      return NextResponse.json({ error: "Name, head name, and email are required." }, { status: 400 });
    }

    const existing = await prisma.office.findFirst({
      where: { name }
    });

    if (existing) {
      return NextResponse.json({ error: "Office with this name already exists." }, { status: 400 });
    }

    const newOffice = await prisma.office.create({
      data: {
        name,
        head,
        email,
      }
    });

    return NextResponse.json(newOffice, { status: 201 });
  } catch (err: any) {
    console.error("[POST /api/offices]", err);
    return NextResponse.json({ error: err.message || "Failed to create office" }, { status: 500 });
  }
}
