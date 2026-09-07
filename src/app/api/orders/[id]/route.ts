import { requireAuth } from "@/lib/auth";
import { ok, fail, parseId } from "@/lib/http";
import { orderService } from "@/services/order.service";

export const dynamic = "force-dynamic";

type Ctx = { params: Promise<{ id: string }> };

export async function GET(req: Request, ctx: Ctx) {
  try {
    const { id } = await ctx.params;
    const actor = await requireAuth(req);
    return ok(await orderService.get(actor, parseId(id)));
  } catch (err) {
    return fail(err);
  }
}
