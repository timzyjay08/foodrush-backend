import { requireAuth } from "@/lib/auth";
import { createOrderSchema } from "@/lib/validators";
import { ok, created, fail } from "@/lib/http";
import { orderService } from "@/services/order.service";
import { createNotification } from "@/lib/notify";
import { recordOrderStatus, recordAudit } from "@/lib/audit";
import { publishOrderUpdate } from "@/lib/events";

export const dynamic = "force-dynamic";

/** Controller (thin): delegate to OrderService, then fire side effects. */
export async function GET(req: Request) {
  try {
    const actor = await requireAuth(req);
    const url = new URL(req.url);
    const status = url.searchParams.get("status")?.trim();
    const orders = await orderService.list(actor, status);
    return ok({ orders });
  } catch (err) {
    return fail(err);
  }
}

export async function POST(req: Request) {
  try {
    const actor = await requireAuth(req);
    const body = await req.json();
    const data = createOrderSchema.parse(body);

    const result = await orderService.create(actor, data);

    // Cross-cutting side effects (notifications, audit, real-time) stay in the
    // controller layer; business logic + persistence live in OrderService.
    await createNotification(actor.id, "Order placed", `Order #${result.order.id} is awaiting payment.`, "order");
    await recordOrderStatus(result.order.id, null, "pending_payment", actor.id, "Order created");
    await recordAudit({
      actorId: actor.id,
      action: "ORDER_CREATED",
      resource: "order",
      resourceId: result.order.id,
      metadata: { restaurantId: result.order.restaurantId, total: result.order.total },
      ip: req.headers.get("x-forwarded-for"),
    });
    publishOrderUpdate(result.order);

    return created(result);
  } catch (err) {
    return fail(err);
  }
}
