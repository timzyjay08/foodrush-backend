import { db } from "@/db";
import { orders, payments } from "@/db/schema";
import { eq } from "drizzle-orm";
import { requireAuth } from "@/lib/auth";
import { verifyPaymentSchema } from "@/lib/validators";
import { ok, fail, ApiError } from "@/lib/http";
import { createNotification } from "@/lib/notify";
import { publishOrderUpdate } from "@/lib/events";

export const dynamic = "force-dynamic";

/** Mark an order as paid and notify the customer. */
async function markPaid(payment: { orderId: number }) {
  const [order] = await db
    .update(orders)
    .set({ status: "paid", updatedAt: new Date() })
    .where(eq(orders.id, payment.orderId))
    .returning();
  if (order) {
    await createNotification(order.userId, "Payment confirmed", `Order #${order.id} has been paid.`, "payment");
    publishOrderUpdate(order);
  }
  return order;
}

export async function POST(req: Request) {
  try {
    // Customer must be authenticated to verify their own payment.
    const actor = await requireAuth(req);
    const body = await req.json();
    const { reference } = verifyPaymentSchema.parse(body);

    const payment = await db.query.payments.findFirst({ where: eq(payments.reference, reference) });
    if (!payment) throw new ApiError(404, "Payment not found", "NOT_FOUND");

    const order = await db.query.orders.findFirst({ where: eq(orders.id, payment.orderId) });
    if (order && order.userId !== actor.id && actor.role !== "admin") {
      throw new ApiError(403, "You cannot verify this payment", "FORBIDDEN");
    }

    if (payment.status === "success") {
      return ok({ payment, order, alreadyPaid: true });
    }

    const secret = process.env.PAYSTACK_SECRET_KEY;
    let verified = false;

    if (secret) {
      const res = await fetch(`https://api.paystack.co/transaction/verify/${reference}`, {
        headers: { Authorization: `Bearer ${secret}` },
      });
      const data = await res.json();
      verified = Boolean(data?.status && data.data?.status === "success");
    } else {
      // Simulation mode: treat verification as successful.
      verified = true;
    }

    if (!verified) {
      await db.update(payments).set({ status: "failed", updatedAt: new Date() }).where(eq(payments.id, payment.id));
      throw new ApiError(400, "Payment verification failed", "PAYMENT_FAILED");
    }

    const [updated] = await db
      .update(payments)
      .set({ status: "success", updatedAt: new Date() })
      .where(eq(payments.id, payment.id))
      .returning();

    const updatedOrder = await markPaid(updated);

    return ok({ payment: updated, order: updatedOrder, paid: true });
  } catch (err) {
    return fail(err);
  }
}
