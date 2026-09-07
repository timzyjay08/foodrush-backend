import { requireAuth } from "@/lib/auth";
import { createMenuItemSchema } from "@/lib/validators";
import { ok, created, fail, parseId } from "@/lib/http";
import { restaurantService } from "@/services/restaurant.service";

export const dynamic = "force-dynamic";

type Ctx = { params: Promise<{ id: string }> };

export async function GET(_req: Request, ctx: Ctx) {
  try {
    const { id } = await ctx.params;
    return ok(await restaurantService.menu(parseId(id)));
  } catch (err) {
    return fail(err);
  }
}

export async function POST(req: Request, ctx: Ctx) {
  try {
    const { id } = await ctx.params;
    const actor = await requireAuth(req);
    const body = await req.json();
    const data = createMenuItemSchema.parse(body);

    const item = await restaurantService.addMenuItem(actor, parseId(id), data);
    return created({ item, options: data.options ?? [] });
  } catch (err) {
    return fail(err);
  }
}
