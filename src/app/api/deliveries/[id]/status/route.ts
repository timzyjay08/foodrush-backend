import { db } from "@/db";
import { deliveries, orders, deliveryRiders } from "@/db/schema";
import { eq } from "drizzle-orm";
import { requireAuth } from "@/lib/auth";
import { ok, fail, parseId, ApiError } from "@/lib/http";
import { createNotification } from "@/lib/notify";
import { publishOrderUpdate } from "@/lib/events";
import { z } from "zod";

export const dynamic = "force-dynamic";

type Ctx = { params: Promise<{ id: string }> };

const statusSchema = z.object({
  status: z.enum(["picked_up", "out_for_delivery", "delivered"]),
});

export async function PATCH(req: Request, ctx: Ctx) {
  try {
    const { id } = await ctx.params;
    const deliveryId = parseId(id);

    const actor = await requireAuth(req);

    const delivery = await db.query.deliveries.findFirst({ where: eq(deliveries.id, deliveryId) });
    if (!delivery) throw new ApiError(404, "Delivery not found", "NOT_FOUND");
    if (actor.role !== "admin" && delivery.riderId !== actor.id) {
      throw new ApiError(403, "You are not assigned to this delivery", "FORBIDDEN");
    }

    const body = await req.json();
    const { status } = statusSchema.parse(body);

    const order = await db.query.orders.findFirst({ where: eq(orders.id, delivery.orderId) });
    if (!order) throw new ApiError(404, "Order not found", "NOT_FOUND");

    const validFrom: Record<string, string[]> = {
      picked_up: ["rider_assigned"],
      out_for_delivery: ["picked_up"],
      delivered: ["out_for_delivery"],
    };
    if (!(validFrom[status] ?? []).includes(order.status)) {
      throw new ApiError(409, `Cannot move order from "${order.status}" to "${status}"`, "INVALID_TRANSITION");
    }

    const deliveryUpdates: Record<string, unknown> = {};
    if (status === "picked_up") deliveryUpdates.pickedUpAt = new Date();
    if (status === "delivered") deliveryUpdates.deliveredAt = new Date();

    if (Object.keys(deliveryUpdates).length > 0) {
      await db.update(deliveries).set(deliveryUpdates).where(eq(deliveries.id, delivery.id));
    }
    await db.update(orders).set({ status, updatedAt: new Date() }).where(eq(orders.id, order.id));

    if (status === "delivered") {
      // Credit the rider and mark them available again.
      const rider = delivery.riderId;
      if (rider) {
        const profile = await db.query.deliveryRiders.findFirst({ where: eq(deliveryRiders.userId, rider) });
        if (profile) {
          await db
            .update(deliveryRiders)
            .set({
              totalDeliveries: profile.totalDeliveries + 1,
              totalEarnings: Math.round((profile.totalEarnings + delivery.earnings) * 100) / 100,
              status: "available",
            })
            .where(eq(deliveryRiders.userId, rider));
        }
      }
      await createNotification(order.userId, "Order delivered", `Order #${order.id} has been delivered. Enjoy! 🎉`, "delivery");
    } else {
      await createNotification(order.userId, "Delivery update", `Order #${order.id} is now ${status}.`, "delivery");
    }

    const [updatedDelivery] = await db.select().from(deliveries).where(eq(deliveries.id, delivery.id));
    const [updatedOrder] = await db.select().from(orders).where(eq(orders.id, order.id));
    publishOrderUpdate(updatedOrder);

    return ok({ delivery: updatedDelivery, order: updatedOrder });
  } catch (err) {
    return fail(err);
  }
}
