import { db } from "@/db";
import { orders, payments, orderStatusHistory } from "@/db/schema";
import { eq } from "drizzle-orm";
import { requireAuth } from "@/lib/auth";
import { ok, fail, parseId, ApiError } from "@/lib/http";
import { createNotification } from "@/lib/notify";
import { publishOrderUpdate } from "@/lib/events";
import { recordAudit, recordOrderStatus } from "@/lib/audit";

export const dynamic = "force-dynamic";

type Ctx = { params: Promise<{ id: string }> };

/**
 * Refund a paid order (admin only). Marks the payment refunded and moves the
 * order to `refunded`. In production, the provider (Paystack) refund would be
 * triggered here and its reference stored.
 */
export async function POST(req: Request, ctx: Ctx) {
  try {
    const { id } = await ctx.params;
    const orderId = parseId(id);

    const actor = await requireAuth(req);
    if (actor.role !== "admin") {
      throw new ApiError(403, "Only admins can issue refunds", "FORBIDDEN");
    }

    const order = await db.query.orders.findFirst({ where: eq(orders.id, orderId) });
    if (!order) throw new ApiError(404, "Order not found", "NOT_FOUND");
    if (order.status === "refunded") throw new ApiError(409, "Order is already refunded", "ALREADY_REFUNDED");

    // Must have a successful payment to refund.
    const payment = await db.query.payments.findFirst({
      where: eq(payments.orderId, orderId),
    });
    if (!payment || payment.status !== "success") {
      throw new ApiError(409, "Order has no successful payment to refund", "NOT_REFUNDABLE");
    }
    if (payment.refundedAt) throw new ApiError(409, "Payment already refunded", "ALREADY_REFUNDED");

    const refundReference = `RF-${Date.now()}-${Math.random().toString(36).slice(2, 8).toUpperCase()}`;
    const now = new Date();

    await db
      .update(payments)
      .set({ refundedAt: now, refundReference, updatedAt: now })
      .where(eq(payments.id, payment.id));

    const [updated] = await db
      .update(orders)
      .set({ status: "refunded", updatedAt: now })
      .where(eq(orders.id, orderId))
      .returning();

    await recordOrderStatus(orderId, order.status, "refunded", actor.id, "Refund issued");
    await recordAudit({
      actorId: actor.id,
      action: "REFUND_ISSUED",
      resource: "order",
      resourceId: orderId,
      metadata: { refundReference, amount: order.total },
      ip: req.headers.get("x-forwarded-for"),
    });
    await createNotification(order.userId, "Refund issued", `Order #${orderId} has been refunded.`, "payment");
    publishOrderUpdate(updated);

    return ok({ order: updated, refund: { refundReference, amount: order.total, refundedAt: now.toISOString() } });
  } catch (err) {
    return fail(err);
  }
}
