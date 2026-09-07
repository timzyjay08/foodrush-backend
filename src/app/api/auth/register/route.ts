import { registerSchema } from "@/lib/validators";
import { created, fail } from "@/lib/http";
import { rateLimit, clientIp } from "@/lib/rate-limit";
import { authCookie } from "@/lib/cookies";
import { authService } from "@/services/auth.service";

export const dynamic = "force-dynamic";

/** Controller (thin): validation + delegation to AuthService. */
export async function POST(req: Request) {
  try {
    await rateLimit({ key: `auth:register:${clientIp(req)}`, limit: 5, windowMs: 60_000 });

    const body = await req.json();
    const data = registerSchema.parse(body);

    const { user, token } = await authService.register(data);

    const response = created({ user, token });
    response.headers.append("Set-Cookie", authCookie(token));
    return response;
  } catch (err) {
    return fail(err);
  }
}
