import { requireAuth, publicUser } from "@/lib/auth";
import { ok, fail } from "@/lib/http";

export const dynamic = "force-dynamic";

export async function GET(req: Request) {
  try {
    const user = await requireAuth(req);
    return ok({ user: publicUser(user) });
  } catch (err) {
    return fail(err);
  }
}
