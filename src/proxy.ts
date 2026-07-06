import { type NextRequest, NextResponse } from "next/server";
import { AUTH_CONFIG } from "@/lib/auth";

export async function proxy(request: NextRequest) {
  const { pathname } = request.nextUrl;

  // Redirect legacy /auth/accept-invite URLs to /accept-invite
  if (pathname === "/auth/accept-invite") {
    const url = new URL("/accept-invite", request.url);
    url.search = request.nextUrl.search;
    return NextResponse.redirect(url);
  }

  // 1. Check setup status via internal API endpoint (runs in Node.js runtime)
  let hasOwner = true;
  try {
    const statusUrl = new URL("/api/setup/status", request.url);
    const res = await fetch(statusUrl.toString(), {
      cache: "no-store",
    });
    if (res.ok) {
      const body = await res.json();
      hasOwner = body.data?.hasOwner ?? true;
    }
  } catch (error) {
    console.error("Failed to query setup status in proxy:", error);
  }

  // 2. Redirect to setup page if no owner accounts exist in the database
  if (!hasOwner) {
    if (pathname !== "/setup") {
      return NextResponse.redirect(new URL("/setup", request.url));
    }
    return NextResponse.next();
  }

  // 3. Block access to /setup and /register once setup is complete
  if (pathname === "/setup" || pathname === "/register") {
    return NextResponse.redirect(new URL("/login", request.url));
  }

  // 4. Session authentication validation and route protection
  const sessionToken = request.cookies.get(
    AUTH_CONFIG.session.cookieName,
  )?.value;
  const isAuthPage =
    pathname === "/login" ||
    pathname === "/forgot-password" ||
    pathname === "/reset-password" ||
    pathname === "/accept-invite";

  if (!sessionToken) {
    // Unauthenticated: redirect to login unless already visiting auth pages
    if (!isAuthPage) {
      return NextResponse.redirect(new URL("/login", request.url));
    }
  } else {
    // Authenticated: redirect to dashboard home if accessing login or reset pages
    if (isAuthPage) {
      return NextResponse.redirect(new URL("/", request.url));
    }
  }

  return NextResponse.next();
}

export const config = {
  matcher: [
    /*
     * Match all routing paths except for:
     * - api/ (API endpoints)
     * - _next/static (static client assets)
     * - _next/image (next image optimizations)
     * - favicon.ico (favicon files)
     */
    "/((?!api|_next/static|_next/image|favicon.ico).*)",
  ],
};
