import { db } from "@/db";
import { deliveryRiders, deliveries } from "@/db/schema";
import { and, desc, eq, isNull, sql } from "drizzle-orm";
import { requireAuth } from "@/lib/auth";
import { ok, fail, ApiError } from "@/lib/http";

export const dynamic = "force-dynamic";

/**
 * Rider earnings summary. Riders can only ever read their own earnings —
 * never modify them, and never see another rider's data.
 */
export async function GET(req: Request) {
  try {
    const actor = await requireAuth(req);
    if (actor.role !== "rider") {
      throw new ApiError(403, "Only riders can view earnings", "FORBIDDEN");
    }

    const profile = await db.query.deliveryRiders.findFirst({ where: eq(deliveryRiders.userId, actor.id) });
    if (!profile) throw new ApiError(404, "Rider profile not found", "NOT_FOUND");

    // Paid earnings = sum of delivered deliveries' earnings.
    const [paidRow] = await db
      .select({ total: sql<number>`coalesce(sum(${deliveries.earnings}), 0)` })
      .from(deliveries)
      .where(and(eq(deliveries.riderId, actor.id), sql`${deliveries.deliveredAt} is not null`));

    // Pending earnings = active deliveries (not yet delivered).
    const [pendingRow] = await db
      .select({ total: sql<number>`coalesce(sum(${deliveries.earnings}), 0)` })
      .from(deliveries)
      .where(and(eq(deliveries.riderId, actor.id), isNull(deliveries.deliveredAt)));

    const completed = await db.query.deliveries.findMany({
      where: and(eq(deliveries.riderId, actor.id), sql`${deliveries.deliveredAt} is not null`),
      orderBy: [desc(deliveries.deliveredAt)],
      limit: 50,
    });

    return ok({
      profile: {
        totalDeliveries: profile.totalDeliveries,
        totalEarnings: profile.totalEarnings,
      },
      paidEarnings: round2(paidRow?.total ?? 0),
      pendingEarnings: round2(pendingRow?.total ?? 0),
      completedDeliveries: completed,
      currency: "NGN",
    });
  } catch (err) {
    return fail(err);
  }
}

function round2(n: number): number {
  return Math.round(n * 100) / 100;
}
