import { db } from "@/db";
import { orders, payments } from "@/db/schema";
import { eq } from "drizzle-orm";
import { ok, fail } from "@/lib/http";
import { createNotification } from "@/lib/notify";
import { publishOrderUpdate } from "@/lib/events";

export const dynamic = "force-dynamic";

/**
 * Paystack webhook. The frontend never determines payment success — this
 * server-side endpoint is the source of truth.
 */
export async function POST(req: Request) {
  try {
    const secret = process.env.PAYSTACK_SECRET_KEY;

    // Verify the webhook signature when a key is configured.
    if (secret) {
      const signature = req.headers.get("x-paystack-signature");
      const raw = await req.clone().text();
      const expected = await hmacSha512(secret, raw);
      if (!signature || signature !== expected) {
        return Response.json({ success: false, message: "Invalid signature", code: "INVALID_SIGNATURE" }, { status: 401 });
      }
    }

    const body = await req.json();
    const reference = body?.data?.reference as string | undefined;
    const status = body?.data?.status as string | undefined;
    if (!reference || !status) return ok({ received: true });

    const payment = await db.query.payments.findFirst({ where: eq(payments.reference, reference) });
    if (!payment) return ok({ received: true, unknown: true });

    if (status === "success" && payment.status !== "success") {
      await db.update(payments).set({ status: "success", updatedAt: new Date() }).where(eq(payments.id, payment.id));
      const [order] = await db
        .update(orders)
        .set({ status: "paid", updatedAt: new Date() })
        .where(eq(orders.id, payment.orderId))
        .returning();
      if (order) {
        await createNotification(order.userId, "Payment confirmed", `Order #${order.id} has been paid.`, "payment");
        publishOrderUpdate(order);
      }
    } else if (status === "failed") {
      await db.update(payments).set({ status: "failed", updatedAt: new Date() }).where(eq(payments.id, payment.id));
    }

    return ok({ received: true });
  } catch (err) {
    return fail(err);
  }
}

async function hmacSha512(key: string, data: string): Promise<string> {
  const enc = new TextEncoder();
  const k = await crypto.subtle.importKey("raw", enc.encode(key), { name: "HMAC", hash: "SHA-512" }, false, ["sign"]);
  const sig = await crypto.subtle.sign("HMAC", k, enc.encode(data));
  return Array.from(new Uint8Array(sig))
    .map((b) => b.toString(16).padStart(2, "0"))
    .join("");
}
