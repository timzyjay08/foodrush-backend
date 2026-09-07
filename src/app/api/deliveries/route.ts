import { db } from "@/db";
import { deliveries, orders, restaurants, deliveryRiders } from "@/db/schema";
import { and, desc, eq, isNull } from "drizzle-orm";
import { requireAuth, requireRole } from "@/lib/auth";
import { created, ok, fail, ApiError, parseId, round2 } from "@/lib/http";
import { createNotification } from "@/lib/notify";
import { publishOrderUpdate } from "@/lib/events";

export const dynamic = "force-dynamic";

export async function GET(req: Request) {
  try {
    const actor = await requireAuth(req);
    const url = new URL(req.url);
    const available = url.searchParams.get("available") === "true";

    if (actor.role === "admin") {
      const list = await db.query.deliveries.findMany({ orderBy: desc(deliveries.createdAt), limit: 100 });
      return ok({ deliveries: list });
    }

    if (actor.role !== "rider") throw new ApiError(403, "Only riders can list deliveries", "FORBIDDEN");

    if (available) {
      // Orders ready for pickup with no rider assigned (delivery requests).
      const requests = await db.query.orders.findMany({
        where: and(eq(orders.status, "ready_for_pickup"), isNull(orders.riderId)),
        orderBy: desc(orders.createdAt),
        limit: 50,
      });
      const enriched = await Promise.all(
        requests.map(async (o) => {
          const restaurant = await db.query.restaurants.findFirst({ where: eq(restaurants.id, o.restaurantId) });
          return { order: o, restaurant: restaurant?.name ?? null, pickupAddress: restaurant?.address ?? null };
        }),
      );
      return ok({ deliveries: enriched });
    }

    const list = await db.query.deliveries.findMany({
      where: eq(deliveries.riderId, actor.id),
      orderBy: desc(deliveries.createdAt),
      limit: 100,
    });
    return ok({ deliveries: list });
  } catch (err) {
    return fail(err);
  }
}

export async function POST(req: Request) {
  try {
    const actor = await requireAuth(req);
    requireRole(actor, ["rider"]);

    const body = await req.json();
    const orderId = parseId(body?.orderId);

    const order = await db.query.orders.findFirst({ where: eq(orders.id, orderId) });
    if (!order) throw new ApiError(404, "Order not found", "NOT_FOUND");
    if (order.status !== "ready_for_pickup" || order.riderId) {
      throw new ApiError(409, "This order is not available for pickup", "NOT_AVAILABLE");
    }

    const profile = await db.query.deliveryRiders.findFirst({ where: eq(deliveryRiders.userId, actor.id) });
    if (!profile || !profile.isApproved) throw new ApiError(403, "Your rider account is not approved", "NOT_APPROVED");

    const [delivery] = await db
      .insert(deliveries)
      .values({ orderId: order.id, riderId: actor.id, distanceKm: order.deliveryDistanceKm, earnings: round2(order.deliveryFee * 0.8) })
      .returning();

    const [updatedOrder] = await db
      .update(orders)
      .set({ riderId: actor.id, status: "rider_assigned", updatedAt: new Date() })
      .where(eq(orders.id, order.id))
      .returning();
    await db.update(deliveryRiders).set({ status: "on_delivery" }).where(eq(deliveryRiders.userId, actor.id));
    await createNotification(order.userId, "Rider assigned", `A rider is on the way for order #${order.id}.`, "delivery");
    publishOrderUpdate(updatedOrder);

    return created({ delivery });
  } catch (err) {
    return fail(err);
  }
}
