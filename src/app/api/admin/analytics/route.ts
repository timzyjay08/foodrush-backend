import { db } from "@/db";
import { users, restaurants, deliveryRiders, orders } from "@/db/schema";
import { count, eq, sql } from "drizzle-orm";
import { requireAuth, requireRole } from "@/lib/auth";
import { ok, fail } from "@/lib/http";

export const dynamic = "force-dynamic";

const ACTIVE_STATUSES = [
  "paid",
  "restaurant_accepted",
  "preparing",
  "ready_for_pickup",
  "rider_assigned",
  "picked_up",
  "out_for_delivery",
  "delivered",
];

export async function GET(req: Request) {
  try {
    const actor = await requireAuth(req);
    requireRole(actor, ["admin"]);

    const [customers] = await db.select({ v: count() }).from(users).where(eq(users.role, "customer"));
    const [restaurantCount] = await db.select({ v: count() }).from(restaurants);
    const [riders] = await db.select({ v: count() }).from(deliveryRiders);
    const [ordersTotal] = await db.select({ v: count() }).from(orders);
    const [ordersToday] = await db
      .select({ v: count() })
      .from(orders)
      .where(sql`${orders.createdAt} >= current_date`);
    const [cancelled] = await db.select({ v: count() }).from(orders).where(eq(orders.status, "cancelled"));
    const [delivered] = await db.select({ v: count() }).from(orders).where(eq(orders.status, "delivered"));

    const [pendingRestaurants] = await db.select({ v: count() }).from(restaurants).where(eq(restaurants.isApproved, false));
    const [pendingRiders] = await db.select({ v: count() }).from(deliveryRiders).where(eq(deliveryRiders.isApproved, false));

    const [revenueToday] = await db
      .select({ v: sql<number>`coalesce(sum(${orders.total}), 0)` })
      .from(orders)
      .where(sql`${orders.createdAt} >= current_date and ${orders.status} != 'cancelled' and ${orders.status} != 'refunded' and ${orders.status} != 'pending_payment'`);

    const [monthlyRevenue] = await db
      .select({ v: sql<number>`coalesce(sum(${orders.total}), 0)` })
      .from(orders)
      .where(sql`${orders.createdAt} >= date_trunc('month', current_date) and ${orders.status} != 'cancelled' and ${orders.status} != 'refunded' and ${orders.status} != 'pending_payment'`);

    // Order status breakdown.
    const statusRows = await db
      .select({ status: orders.status, v: count() })
      .from(orders)
      .groupBy(orders.status);
    const statusBreakdown: Record<string, number> = {};
    for (const r of statusRows) statusBreakdown[r.status] = r.v;

    return ok({
      customers: customers.v,
      restaurants: restaurantCount.v,
      riders: riders.v,
      ordersTotal: ordersTotal.v,
      ordersToday: ordersToday.v,
      ordersDelivered: delivered.v,
      ordersCancelled: cancelled.v,
      activeOrders: statusRows.filter((r) => ACTIVE_STATUSES.includes(r.status)).reduce((a, r) => a + r.v, 0),
      revenueToday: Math.round((revenueToday.v ?? 0) * 100) / 100,
      monthlyRevenue: Math.round((monthlyRevenue.v ?? 0) * 100) / 100,
      pendingRestaurantApprovals: pendingRestaurants.v,
      pendingRiderApprovals: pendingRiders.v,
      statusBreakdown,
      currency: "NGN",
    });
  } catch (err) {
    return fail(err);
  }
}
