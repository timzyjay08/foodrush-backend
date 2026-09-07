import { NextResponse, type NextRequest } from "next/server";
import { authorize } from "@/lib/authz";
import { verifyToken } from "@/lib/jwt";
import { AUTH_COOKIE } from "@/lib/server-auth";

/**
 * Route protection for the dashboard area.
 *
 * Runs on the edge runtime, so it verifies the JWT (no DB lookup) and applies
 * the pure authorization rules from `@/lib/authz`:
 *   - anonymous  -> /login
 *   - wrong role -> their own dashboard
 *   - non-dashboard role -> /browse
 */
export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  let role: string | null = null;
  const token = request.cookies.get(AUTH_COOKIE)?.value;
  if (token) {
    try {
      const payload = await verifyToken(token);
      role = (payload.role as string) ?? null;
    } catch {
      role = null;
    }
  }

  const decision = authorize(pathname, role);

  if (!decision.allowed && decision.redirectTo) {
    const url = new URL(decision.redirectTo, request.url);
    return NextResponse.redirect(url);
  }

  return NextResponse.next();
}

export const config = {
  matcher: ["/dashboard/:path*"],
};
