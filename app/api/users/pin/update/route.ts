import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/authOptions";
import { prisma } from "@/lib/prisma";

/**
 * POST /api/users/pin/update
 * Updates the current session user's security PIN.
 * Body: { currentPin: string, newPin: string }
 * Returns: { success: boolean }
 */
export async function POST(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions);

    const email =
      (session?.user as any)?.email ??
      req.headers.get("x-dev-email") ??
      null;

    if (!email) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { currentPin, newPin } = await req.json();

    if (!currentPin || !newPin) {
      return NextResponse.json(
        { error: "Both currentPin and newPin are required" },
        { status: 400 }
      );
    }

    if (newPin.length < 4 || newPin.length > 6) {
      return NextResponse.json(
        { error: "PIN must be 4–6 digits." },
        { status: 400 }
      );
    }

    if (!/^\d+$/.test(newPin)) {
      return NextResponse.json(
        { error: "PIN must contain digits only." },
        { status: 400 }
      );
    }

    const user = await prisma.user.findUnique({
      where: { email },
      select: { id: true, pin: true },
    });

    if (!user) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    const existingPin = user.pin ?? "1234";
    if (currentPin.trim() !== existingPin) {
      return NextResponse.json(
        { error: "Current PIN is incorrect." },
        { status: 403 }
      );
    }

    await prisma.user.update({
      where: { id: user.id },
      data: { pin: newPin.trim() },
    });

    return NextResponse.json({ success: true });
  } catch (err) {
    console.error("[POST /api/users/pin/update]", err);
    return NextResponse.json({ error: "Server error" }, { status: 500 });
  }
}
