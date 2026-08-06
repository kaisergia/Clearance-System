import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

/**
 * POST /api/users/pin/reset
 * DEVELOPER DIAGNOSTICS ONLY — resets all user PINs back to "1234".
 * Returns: { success: boolean, resetCount: number }
 */
export async function POST() {
  try {
    const result = await prisma.user.updateMany({
      data: { pin: "1234" },
    });

    return NextResponse.json({
      success: true,
      resetCount: result.count,
      message: `Successfully reset ${result.count} user PIN(s) to "1234".`,
    });
  } catch (err) {
    console.error("[POST /api/users/pin/reset]", err);
    return NextResponse.json({ error: "Server error" }, { status: 500 });
  }
}
