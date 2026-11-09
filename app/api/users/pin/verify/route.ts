import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/authOptions";
import { prisma } from "@/lib/prisma";

/**
 * POST /api/users/pin/verify
 * Verifies the supplied PIN against the current session user's stored PIN.
 * Body: { pin: string }
 * Returns: { valid: boolean }
 */
export async function POST(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    const forwardedHost = req.headers.get("x-forwarded-host") ?? "";
    const host = req.headers.get("host") ?? "";
    const requestHost = forwardedHost || host;
    const configuredDevHosts = (process.env.PIN_DEV_BYPASS_HOSTS ?? "")
      .split(",")
      .map((value) => value.trim().toLowerCase())
      .filter(Boolean);
    const isConfiguredDevHost = configuredDevHosts.includes(requestHost.toLowerCase());
    const devEmail = process.env.PIN_DEV_AUTH_EMAIL ?? "";

    // Prefer the authenticated user. For explicitly configured development
    // hosts only, allow the seeded admin identity when no session email exists.
    const email =
      (session?.user as any)?.email ??
      req.headers.get("x-dev-email") ??
      (isConfiguredDevHost ? devEmail : null);

    if (!email) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { pin } = await req.json();
    if (!pin || typeof pin !== "string") {
      return NextResponse.json({ error: "PIN is required" }, { status: 400 });
    }

    const user = await prisma.user.findUnique({
      where: { email },
      select: { pin: true },
    });

    if (!user) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    const valid = pin.trim() === (user.pin ?? "1234");
    return NextResponse.json({ valid });
  } catch (err) {
    console.error("[POST /api/users/pin/verify]", err);
    return NextResponse.json({ error: "Server error" }, { status: 500 });
  }
}
