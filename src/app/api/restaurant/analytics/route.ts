import { db } from "@/db";
import { restaurants, orders, orderItems, reviews } from "@/db/schema";
import { and, desc, eq, inArray, sql } from "drizzle-orm";
import { requireAuth } from "@/lib/auth";
import { ok, fail, ApiError } from "@/lib/http";

export const dynamic = "force-dynamic";

/**
 * Restaurant owner analytics — scoped strictly to restaurants they own.
 * Never exposes another restaurant's data.
 */
export async function GET(req: Request) {
  try {
    const actor = await requireAuth(req);
    if (actor.role !== "restaurant" && actor.role !== "admin") {
      throw new ApiError(403, "Not authorized", "FORBIDDEN");
    }

    const owned = actor.role === "admin"
      ? await db.query.restaurants.findMany()
      : await db.query.restaurants.findMany({ where: eq(restaurants.ownerId, actor.id) });

    const ids = owned.map((r) => r.id);
    if (ids.length === 0) {
      return ok({ restaurants: [], totals: zeroTotals(), topFoods: [] });
    }

    const allOrders = await db.query.orders.findMany({
      where: inArray(orders.restaurantId, ids),
      orderBy: [desc(orders.createdAt)],
      limit: 500,
    });

    const completed = allOrders.filter((o) => o.status === "delivered");
    const cancelled = allOrders.filter((o) => o.status === "cancelled");
    const revenue = completed.reduce((a, o) => a + o.total, 0);
    const avgOrder = completed.length ? revenue / completed.length : 0;

    // Popular foods across these restaurants.
    const itemIds = allOrders.map((o) => o.id);
    let topFoods: { name: string; quantity: number }[] = [];
    if (itemIds.length > 0) {
      const lines = await db
        .select({ name: orderItems.name, qty: sql<number>`sum(${orderItems.quantity})` })
        .from(orderItems)
        .where(inArray(orderItems.orderId, itemIds))
        .groupBy(orderItems.name)
        .orderBy(sql`sum(${orderItems.quantity}) desc`)
        .limit(10);
      topFoods = lines.map((l) => ({ name: l.name, quantity: Number(l.qty) }));
    }

    const reviewCount = owned.reduce((a, r) => a + r.ratingCount, 0);

    return ok({
      restaurants: owned.map((r) => ({
        id: r.id,
        name: r.name,
        rating: r.rating,
        ratingCount: r.ratingCount,
      })),
      totals: {
        orders: allOrders.length,
        completed: completed.length,
        cancelled: cancelled.length,
        revenue: round2(revenue),
        averageOrderValue: round2(avgOrder),
        reviewCount,
        currency: "NGN",
      },
      topFoods,
    });
  } catch (err) {
    return fail(err);
  }
}

function zeroTotals() {
  return { orders: 0, completed: 0, cancelled: 0, revenue: 0, averageOrderValue: 0, reviewCount: 0, currency: "NGN" };
}

function round2(n: number): number {
  return Math.round(n * 100) / 100;
}
