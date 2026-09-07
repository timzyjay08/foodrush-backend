import { db } from "@/db";
import { orders, restaurants, users, deliveryRiders, deliveries } from "@/db/schema";
import { eq } from "drizzle-orm";
import { requireAuth } from "@/lib/auth";
import { assignRiderSchema } from "@/lib/validators";
import { ok, fail, parseId, ApiError, round2 } from "@/lib/http";
import { createNotification } from "@/lib/notify";
import { publishOrderUpdate } from "@/lib/events";

export const dynamic = "force-dynamic";

type Ctx = { params: Promise<{ id: string }> };

export async function POST(req: Request, ctx: Ctx) {
  try {
    const { id } = await ctx.params;
    const orderId = parseId(id);

    const actor = await requireAuth(req);

    const order = await db.query.orders.findFirst({ where: eq(orders.id, orderId) });
    if (!order) throw new ApiError(404, "Order not found", "NOT_FOUND");

    if (actor.role !== "admin") {
      const restaurant = await db.query.restaurants.findFirst({ where: eq(restaurants.id, order.restaurantId) });
      if (!restaurant || restaurant.ownerId !== actor.id) {
        throw new ApiError(403, "You do not own this restaurant", "FORBIDDEN");
      }
    }

    if (order.status !== "ready_for_pickup") {
      throw new ApiError(409, `Cannot assign a rider while order is "${order.status}"`, "INVALID_TRANSITION");
    }

    const body = await req.json();
    const { riderId } = assignRiderSchema.parse(body);

    const rider = await db.query.users.findFirst({ where: eq(users.id, riderId) });
    if (!rider || rider.role !== "rider") throw new ApiError(400, "The assigned user is not a rider", "NOT_A_RIDER");

    const riderProfile = await db.query.deliveryRiders.findFirst({ where: eq(deliveryRiders.userId, rider.id) });
    if (!riderProfile || !riderProfile.isApproved) throw new ApiError(400, "This rider is not approved", "NOT_APPROVED");

    const [updated] = await db
      .update(orders)
      .set({ riderId: rider.id, status: "rider_assigned", updatedAt: new Date() })
      .where(eq(orders.id, orderId))
      .returning();

    // Create the delivery record.
    await db.insert(deliveries).values({
      orderId: order.id,
      riderId: rider.id,
      distanceKm: order.deliveryDistanceKm,
      earnings: round2(order.deliveryFee * 0.8),
    });

    await db.update(deliveryRiders).set({ status: "on_delivery" }).where(eq(deliveryRiders.userId, rider.id));
    await createNotification(rider.id, "New delivery", `You are assigned to order #${order.id}.`, "delivery");
    publishOrderUpdate(updated);

    return ok({ order: updated });
  } catch (err) {
    return fail(err);
  }
}
