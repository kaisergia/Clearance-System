/**
 * app/api/auth/logout/route.ts
 *
 * POST /api/auth/logout
 * Clears all session cookies and redirects to /login.
 */

import { NextResponse } from "next/server";

export async function POST() {
  const response = NextResponse.json({ ok: true });

  const cookiesToClear = ["role", "officeId", "departmentId", "orgId", "activeStudentId"];
  for (const name of cookiesToClear) {
    response.cookies.set(name, "", { maxAge: 0, path: "/" });
  }

  return response;
}
