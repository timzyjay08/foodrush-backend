import { db } from "@/db";
import { deliveryRiders, reviews, users, deliveries } from "@/db/schema";
import { and, count, eq, sql } from "drizzle-orm";
import { requireAuth } from "@/lib/auth";
import { updateRiderSchema } from "@/lib/validators";
import { ok, fail, ApiError } from "@/lib/http";

export const dynamic = "force-dynamic";

export async function GET(req: Request) {
  try {
    const actor = await requireAuth(req);
    if (actor.role !== "rider") throw new ApiError(403, "Not a rider", "FORBIDDEN");

    const profile = await db.query.deliveryRiders.findFirst({ where: eq(deliveryRiders.userId, actor.id) });
    if (!profile) throw new ApiError(404, "Rider profile not found", "NOT_FOUND");

    // Aggregate rating from reviews.
    const [ratingRow] = await db
      .select({ avg: sql<number>`coalesce(avg(${reviews.rating}), 0)`, n: count() })
      .from(reviews)
      .where(eq(reviews.riderId, actor.id));

    // Today's completed deliveries + earnings.
    const startOfDay = new Date();
    startOfDay.setHours(0, 0, 0, 0);
    const todayDeliveries = await db
      .select({ id: deliveries.id })
      .from(deliveries)
      .where(and(eq(deliveries.riderId, actor.id), sql`${deliveries.deliveredAt} >= ${startOfDay}`));

    return ok({
      profile,
      user: { id: actor.id, name: actor.name, email: actor.email, phone: actor.phone },
      rating: Math.round((ratingRow?.avg ?? 0) * 10) / 10,
      ratingCount: ratingRow?.n ?? 0,
      todayDeliveries: todayDeliveries.length,
    });
  } catch (err) {
    return fail(err);
  }
}

export async function PATCH(req: Request) {
  try {
    const actor = await requireAuth(req);
    if (actor.role !== "rider") throw new ApiError(403, "Not a rider", "FORBIDDEN");

    const profile = await db.query.deliveryRiders.findFirst({ where: eq(deliveryRiders.userId, actor.id) });
    if (!profile) throw new ApiError(404, "Rider profile not found", "NOT_FOUND");

    const body = await req.json();
    const data = updateRiderSchema.parse(body);

    const updates: Record<string, unknown> = {};
    if (data.vehicle !== undefined) updates.vehicle = data.vehicle;
    if (data.isOnline !== undefined) {
      updates.isOnline = data.isOnline;
      updates.status = data.isOnline ? "available" : "offline";
    }

    const [updated] = await db
      .update(deliveryRiders)
      .set(updates)
      .where(eq(deliveryRiders.id, profile.id))
      .returning();

    return ok({ profile: updated });
  } catch (err) {
    return fail(err);
  }
}
