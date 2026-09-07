import { db } from "@/db";
import { orders, orderStatusHistory, restaurants } from "@/db/schema";
import { asc, eq } from "drizzle-orm";
import { requireAuth } from "@/lib/auth";
import { ok, fail, parseId, ApiError } from "@/lib/http";

export const dynamic = "force-dynamic";

type Ctx = { params: Promise<{ id: string }> };

/** Full audit trail of an order's status transitions. */
export async function GET(req: Request, ctx: Ctx) {
  try {
    const { id } = await ctx.params;
    const orderId = parseId(id);

    const actor = await requireAuth(req);
    const order = await db.query.orders.findFirst({ where: eq(orders.id, orderId) });
    if (!order) throw new ApiError(404, "Order not found", "NOT_FOUND");

    // Only the customer, rider, owning restaurant, or admin may view history.
    let allowed = actor.role === "admin" || order.userId === actor.id || order.riderId === actor.id;
    if (!allowed && actor.role === "restaurant") {
      const restaurant = await db.query.restaurants.findFirst({ where: eq(restaurants.id, order.restaurantId) });
      allowed = restaurant?.ownerId === actor.id;
    }
    if (!allowed) throw new ApiError(403, "You cannot view this order", "FORBIDDEN");

    const history = await db.query.orderStatusHistory.findMany({
      where: eq(orderStatusHistory.orderId, orderId),
      orderBy: [asc(orderStatusHistory.createdAt)],
    });

    return ok({ orderId, currentStatus: order.status, history });
  } catch (err) {
    return fail(err);
  }
}
