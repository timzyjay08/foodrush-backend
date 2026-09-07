import { requireAuth } from "@/lib/auth";
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

    const order = await orderService.cancel(actor, orderId);

    await createNotification(order.userId, "Order cancelled", `Order #${order.id} was cancelled.`, "order");
    await recordOrderStatus(orderId, null, "cancelled", actor.id, "Cancelled by user");
    await recordAudit({
      actorId: actor.id,
      action: "ORDER_CANCELLED",
      resource: "order",
      resourceId: orderId,
      ip: req.headers.get("x-forwarded-for"),
    });
    publishOrderUpdate(order);

    return ok({ order });
  } catch (err) {
    return fail(err);
  }
}
