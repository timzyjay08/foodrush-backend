import { db } from "@/db";
import { orders, restaurants } from "@/db/schema";
import { eq } from "drizzle-orm";
import { requireAuth } from "@/lib/auth";
import { fail } from "@/lib/http";
import { subscribe, userChannel, orderChannel, driverLocationChannel } from "@/lib/events";

export const dynamic = "force-dynamic";

/**
 * Server-Sent Events (SSE) stream for real-time order updates.
 *
 * The current user receives a live push every time one of their orders changes
 * state (payment, restaurant acceptance, rider pickup, delivery, cancellation).
 * The client connects via EventSource with the JWT in the `?token=` query param.
 *
 * If `?orderId=<n>` is provided, only that order is streamed (targeted tracking).
 */
export async function GET(req: Request) {
  let actor;
  try {
    actor = await requireAuth(req);
  } catch (err) {
    return fail(err);
  }
  const url = new URL(req.url);
  const orderIdParam = url.searchParams.get("orderId");
  const orderId = orderIdParam ? Number(orderIdParam) : null;

  // Authorize the targeted order if requested.
  if (orderId && Number.isInteger(orderId) && orderId > 0) {
    const order = await db.query.orders.findFirst({ where: eq(orders.id, orderId) });
    if (!order) {
      return Response.json({ success: false, message: "Order not found", code: "NOT_FOUND" }, { status: 404 });
    }
    let allowed = actor.role === "admin" || order.userId === actor.id || order.riderId === actor.id;
    if (!allowed && actor.role === "restaurant") {
      const restaurant = await db.query.restaurants.findFirst({ where: eq(restaurants.id, order.restaurantId) });
      allowed = restaurant?.ownerId === actor.id;
    }
    if (!allowed) {
      return Response.json({ success: false, message: "You cannot view this order", code: "FORBIDDEN" }, { status: 403 });
    }
  }

  const encoder = new TextEncoder();

  const stream = new ReadableStream<Uint8Array>({
    start(controller) {
      const send = (event: string, data: unknown) => {
        try {
          controller.enqueue(encoder.encode(`event: ${event}\ndata: ${JSON.stringify(data)}\n\n`));
        } catch {
          // Stream already closed.
        }
      };

      const onOrderUpdate = (data: unknown) => send("order", data);
      const onDriverLocation = (data: unknown) => send("driver_location", data);

      // Subscribe to the targeted order, or to the user's whole order feed.
      const unsubs: Array<() => void> = [];
      if (orderId) {
        unsubs.push(subscribe(orderChannel(orderId), onOrderUpdate));
      } else {
        unsubs.push(subscribe(userChannel(actor.id), onOrderUpdate));
      }
      // Driver location updates stream on a dedicated channel.
      unsubs.push(subscribe(driverLocationChannel(actor.id), onDriverLocation));

      // Send an initial snapshot so the client is never blank.
      (async () => {
        try {
          if (orderId) {
            const order = await db.query.orders.findFirst({ where: eq(orders.id, orderId) });
            if (order) send("order", order);
          } else {
            const list = await db.query.orders.findMany({
              where: eq(orders.userId, actor.id),
              orderBy: (o, { desc }) => [desc(o.createdAt)],
              limit: 50,
            });
            send("orders", list);
          }
          send("ready", { connected: true });
        } catch {
          send("ready", { connected: true });
        }
      })();

      // Heartbeat keeps the connection alive and detects drops.
      const heartbeat = setInterval(() => {
        try {
          controller.enqueue(encoder.encode(`: ping\n\n`));
        } catch {
          clearInterval(heartbeat);
        }
      }, 15000);

      // Cleanup when the client disconnects.
      req.signal.addEventListener("abort", () => {
        clearInterval(heartbeat);
        unsubs.forEach((u) => u());
        try {
          controller.close();
        } catch {
          /* noop */
        }
      });
    },
  });

  return new Response(stream, {
    headers: {
      "Content-Type": "text/event-stream; charset=utf-8",
      "Cache-Control": "no-cache, no-transform",
      Connection: "keep-alive",
      "X-Accel-Buffering": "no",
    },
  });
}
