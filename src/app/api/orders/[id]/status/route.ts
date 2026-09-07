import { requireAuth } from "@/lib/auth";
import { updateOrderStatusSchema } from "@/lib/validators";
import { ok, fail, parseId } from "@/lib/http";
import { orderService } from "@/services/order.service";
import { createNotification } from "@/lib/notify";
import { recordOrderStatus, recordAudit } from "@/lib/audit";
import { publishOrderUpdate } from "@/lib/events";

export const dynamic = "force-dynamic";

type Ctx = { params: Promise<{ id: string }> };

export async function PATCH(req: Request, ctx: Ctx) {
  try {
    const { id } = await ctx.params;
    const orderId = parseId(id);
    const actor = await requireAuth(req);

    const body = await req.json();
    const { status } = updateOrderStatusSchema.parse(body);

    // The service validates the transition + ownership and persists it.
    const order = await orderService.updateStatus(actor, orderId, status);

    await createNotification(order.userId, "Order update", `Order #${order.id} is now ${status}.`, "order");
    await recordOrderStatus(orderId, null, status, actor.id);
    await recordAudit({
      actorId: actor.id,
      action: "ORDER_STATUS_CHANGED",
      resource: "order",
      resourceId: orderId,
      metadata: { to: status },
      ip: req.headers.get("x-forwarded-for"),
    });
    publishOrderUpdate(order);

    return ok({ order });
  } catch (err) {
    return fail(err);
  }
}
