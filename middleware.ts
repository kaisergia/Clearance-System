import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

// Which paths each role is allowed to access
const ROLE_ACCESS: Record<string, string> = {
  admin: "/admin",
  "head-office": "/head-office",
  org: "/org",
  student: "/student",
};

export function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  // Get role from cookie (set at login — more secure than localStorage for middleware)
  const role = request.cookies.get("role")?.value;

  // If visiting root, redirect to login
  if (pathname === "/") {
    return NextResponse.redirect(new URL("/login", request.url));
  }

  // If visiting a protected route without a role, redirect to login
  const isProtectedRoute =
    pathname.startsWith("/admin") ||
    pathname.startsWith("/head-office") ||
    pathname.startsWith("/org") ||
    pathname.startsWith("/student");

  if (isProtectedRoute && !role) {
    return NextResponse.redirect(new URL("/login", request.url));
  }

  // If role exists but tries to access wrong dashboard, redirect them
  if (role && isProtectedRoute) {
    const allowedPath = ROLE_ACCESS[role];
    if (!pathname.startsWith(allowedPath)) {
      return NextResponse.redirect(new URL(`${allowedPath}/dashboard`, request.url));
    }
  }

  return NextResponse.next();
}

export const config = {
  matcher: ["/((?!api|_next/static|_next/image|favicon.ico).*)"],
};
