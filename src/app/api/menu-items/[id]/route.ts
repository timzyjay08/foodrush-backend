import { db } from "@/db";
import { menuItems, restaurants } from "@/db/schema";
import { eq } from "drizzle-orm";
import { requireAuth } from "@/lib/auth";
import { updateMenuItemSchema } from "@/lib/validators";
import { ok, fail, parseId, ApiError } from "@/lib/http";

export const dynamic = "force-dynamic";

type Ctx = { params: Promise<{ id: string }> };

async function assertItemOwner(actor: { id: number; role: string }, itemId: number) {
  const item = await db.query.menuItems.findFirst({
    where: eq(menuItems.id, itemId),
  });
  if (!item) throw new ApiError(404, "Menu item not found", "NOT_FOUND");
  if (actor.role === "admin") return item;

  const restaurant = await db.query.restaurants.findFirst({
    where: eq(restaurants.id, item.restaurantId),
  });
  if (!restaurant || restaurant.ownerId !== actor.id) {
    throw new ApiError(403, "You do not own this menu item", "FORBIDDEN");
  }
  return item;
}

export async function PATCH(req: Request, ctx: Ctx) {
  try {
    const { id } = await ctx.params;
    const itemId = parseId(id);

    const actor = await requireAuth(req);
    await assertItemOwner(actor, itemId);

    const body = await req.json();
    const data = updateMenuItemSchema.parse(body);
    if (Object.keys(data).length === 0) {
      throw new ApiError(400, "No fields to update", "EMPTY_UPDATE");
    }

    const [updated] = await db
      .update(menuItems)
      .set(data)
      .where(eq(menuItems.id, itemId))
      .returning();

    return ok({ item: updated });
  } catch (err) {
    return fail(err);
  }
}

export async function DELETE(req: Request, ctx: Ctx) {
  try {
    const { id } = await ctx.params;
    const itemId = parseId(id);

    const actor = await requireAuth(req);
    await assertItemOwner(actor, itemId);

    const [deleted] = await db
      .delete(menuItems)
      .where(eq(menuItems.id, itemId))
      .returning({ id: menuItems.id });

    return ok({ deleted: true, id: deleted.id });
  } catch (err) {
    return fail(err);
  }
}
