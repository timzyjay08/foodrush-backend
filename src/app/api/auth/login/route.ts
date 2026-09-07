import { loginSchema } from "@/lib/validators";
import { ok, fail } from "@/lib/http";
import { rateLimit, clientIp } from "@/lib/rate-limit";
import { authCookie } from "@/lib/cookies";
import { authService } from "@/services/auth.service";

export const dynamic = "force-dynamic";

/**
 * Controller (thin): rate-limit + parse request, then delegate all business
 * logic to AuthService. Returns the session token in an HttpOnly cookie.
 */
export async function POST(req: Request) {
  try {
    await rateLimit({ key: `auth:login:${clientIp(req)}`, limit: 10, windowMs: 60_000 });

    const body = await req.json();
    const data = loginSchema.parse(body);

    const { user, token } = await authService.login(data.email, data.password);

    const response = ok({ user, token });
    response.headers.append("Set-Cookie", authCookie(token));
    return response;
  } catch (err) {
    return fail(err);
  }
}
