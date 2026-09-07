import { db } from "@/db";
import { orders, payments, users } from "@/db/schema";
import { and, eq } from "drizzle-orm";
import { requireAuth } from "@/lib/auth";
import { initializePaymentSchema } from "@/lib/validators";
import { ok, fail, ApiError } from "@/lib/http";

export const dynamic = "force-dynamic";

function makeReference(): string {
  return `FR-${Date.now()}-${Math.random().toString(36).slice(2, 8).toUpperCase()}`;
}

export async function POST(req: Request) {
  try {
    const actor = await requireAuth(req);
    const body = await req.json();
    const { orderId } = initializePaymentSchema.parse(body);

    const order = await db.query.orders.findFirst({ where: eq(orders.id, orderId) });
    if (!order) throw new ApiError(404, "Order not found", "NOT_FOUND");
    if (order.userId !== actor.id && actor.role !== "admin") {
      throw new ApiError(403, "You cannot pay for this order", "FORBIDDEN");
    }
    if (order.status !== "pending_payment") {
      throw new ApiError(409, `Order cannot be paid while "${order.status}"`, "INVALID_STATE");
    }

    // Reuse an existing pending payment if present.
    let payment = await db.query.payments.findFirst({
      where: and(eq(payments.orderId, order.id), eq(payments.status, "pending")),
    });
    if (!payment) {
      [payment] = await db
        .insert(payments)
        .values({ orderId: order.id, reference: makeReference(), amount: order.total, status: "pending" })
        .returning();
    }

    const email = await db.query.users.findFirst({ where: eq(users.id, order.userId) });

    const secret = process.env.PAYSTACK_SECRET_KEY;
    let authorizationUrl: string | null = null;

    if (secret) {
      // Real Paystack integration (amount in kobo).
      const res = await fetch("https://api.paystack.co/transaction/initialize", {
        method: "POST",
        headers: { Authorization: `Bearer ${secret}`, "Content-Type": "application/json" },
        body: JSON.stringify({
          email: email?.email,
          amount: Math.round(order.total * 100),
          reference: payment.reference,
          currency: "NGN",
        }),
      });
      const data = await res.json();
      if (!res.ok || !data?.status) {
        throw new ApiError(502, data?.message ?? "Payment provider error", "PROVIDER_ERROR");
      }
      authorizationUrl = data.data.authorization_url;
    } else {
      // Simulation mode (no PAYSTACK_SECRET_KEY configured).
      authorizationUrl = `/api/payments/verify?reference=${payment.reference}`;
    }

    return ok({
      payment,
      order,
      amount: order.total,
      currency: "NGN",
      authorizationUrl,
      simulated: !secret,
    });
  } catch (err) {
    return fail(err);
  }
}
