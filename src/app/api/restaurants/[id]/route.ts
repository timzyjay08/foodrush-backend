import { requireAuth } from "@/lib/auth";
import { updateRestaurantSchema } from "@/lib/validators";
import { ok, fail, parseId } from "@/lib/http";
import { restaurantService } from "@/services/restaurant.service";

export const dynamic = "force-dynamic";

type Ctx = { params: Promise<{ id: string }> };

export async function GET(_req: Request, ctx: Ctx) {
  try {
    const { id } = await ctx.params;
    return ok(await restaurantService.get(parseId(id)));
  } catch (err) {
    return fail(err);
  }
}

export async function PATCH(req: Request, ctx: Ctx) {
  try {
    const { id } = await ctx.params;
    const actor = await requireAuth(req);
    const body = await req.json();
    const data = updateRestaurantSchema.parse(body);

    if (Object.keys(data).length === 0) {
      return ok(await restaurantService.update(actor, parseId(id), {}));
    }

    const restaurant = await restaurantService.update(actor, parseId(id), data);
    return ok({ restaurant });
  } catch (err) {
    return fail(err);
  }
}

export async function DELETE(req: Request, ctx: Ctx) {
  try {
    const { id } = await ctx.params;
    const actor = await requireAuth(req);
    const restaurantId = parseId(id);
    await restaurantService.remove(actor, restaurantId);
    return ok({ deleted: true, id: restaurantId });
  } catch (err) {
    return fail(err);
  }
}
