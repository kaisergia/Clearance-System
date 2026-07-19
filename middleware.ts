import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { getToken } from "next-auth/jwt";

// Which paths each role is allowed to access
const ROLE_ACCESS: Record<string, string> = {
  admin: "/admin",
  "head-office": "/head-office",
  department: "/department",
  org: "/org",
  student: "/student",
};

export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  // Check for developer role overrides in cookies
  let role = request.cookies.get("dev-role-override")?.value;

  if (!role) {
    // Retrieve NextAuth JWT token to extract authenticated role
    const token = await getToken({
      req: request,
      secret: process.env.NEXTAUTH_SECRET,
    });
    role = token?.role as string | undefined;
  }

  // If user is already logged in and visits root or login page, redirect to dashboard
  if (role && (pathname === "/" || pathname === "/login")) {
    const allowedPath = ROLE_ACCESS[role];
    if (allowedPath) {
      return NextResponse.redirect(new URL(`${allowedPath}/dashboard`, request.url));
    }
  }

  // If visiting root, redirect to login
  if (pathname === "/") {
    return NextResponse.redirect(new URL("/login", request.url));
  }

  // If visiting a protected route without a role, redirect to login
  const isProtectedRoute =
    pathname.startsWith("/admin") ||
    pathname.startsWith("/head-office") ||
    pathname.startsWith("/department") ||
    pathname.startsWith("/org") ||
    pathname.startsWith("/student");

  if (isProtectedRoute && !role) {
    return NextResponse.redirect(new URL("/login", request.url));
  }

  // If role exists but tries to access wrong dashboard, redirect them
  if (role && isProtectedRoute) {
    const allowedPath = ROLE_ACCESS[role];
    if (!pathname.startsWith(allowedPath)) {
      // Allow admin to view student clearance details
      if (role === "admin" && pathname.startsWith("/student/clearance")) {
        return NextResponse.next();
      }
      return NextResponse.redirect(new URL(`${allowedPath}/dashboard`, request.url));
    }
  }

  return NextResponse.next();
}

export const config = {
  matcher: ["/((?!api|_next/static|_next/image|favicon.ico).*)"],
};
