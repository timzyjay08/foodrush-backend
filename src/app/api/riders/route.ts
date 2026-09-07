import { db } from "@/db";
import { deliveryRiders, users } from "@/db/schema";
import { eq } from "drizzle-orm";
import { requireAuth, requireRole } from "@/lib/auth";
import { ok, fail } from "@/lib/http";

export const dynamic = "force-dynamic";

export async function GET(req: Request) {
  try {
    const actor = await requireAuth(req);
    requireRole(actor, ["admin", "restaurant"]);

    const riders = await db.query.deliveryRiders.findMany();
    const enriched = await Promise.all(
      riders.map(async (r) => {
        const user = await db.query.users.findFirst({ where: eq(users.id, r.userId) });
        return { ...r, name: user?.name ?? "Unknown", email: user?.email, phone: user?.phone };
      }),
    );

    return ok({ riders: enriched });
  } catch (err) {
    return fail(err);
  }
}
