import { ok } from "@/lib/http";
import { clearAuthCookie } from "@/lib/cookies";

export const dynamic = "force-dynamic";

/**
 * Clears the auth cookie (the JWT itself is stateless, so logging out is
 * simply clearing the client-side session token).
 */
export async function POST() {
  const response = ok({ success: true });
  response.headers.append("Set-Cookie", clearAuthCookie());
  return response;
}
