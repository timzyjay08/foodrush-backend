import { db } from "@/db";
import { cartItems, carts } from "@/db/schema";
import { eq } from "drizzle-orm";
import { requireAuth } from "@/lib/auth";
import { updateCartItemSchema } from "@/lib/validators";
import { ok, fail, parseId, ApiError } from "@/lib/http";

export const dynamic = "force-dynamic";

type Ctx = { params: Promise<{ id: string }> };

export async function PATCH(req: Request, ctx: Ctx) {
  try {
    const { id } = await ctx.params;
    const lineId = parseId(id);

    const actor = await requireAuth(req);

    const line = await db.query.cartItems.findFirst({ where: eq(cartItems.id, lineId) });
    if (!line) throw new ApiError(404, "Cart item not found", "NOT_FOUND");

    const cart = await db.query.carts.findFirst({ where: eq(carts.id, line.cartId) });
    if (!cart || cart.userId !== actor.id) throw new ApiError(403, "You do not own this cart", "FORBIDDEN");

    const body = await req.json();
    const data = updateCartItemSchema.parse(body);

    if (data.quantity === 0) {
      await db.delete(cartItems).where(eq(cartItems.id, lineId));
      return ok({ removed: true, id: lineId });
    }

    const updates: Record<string, unknown> = {};
    if (data.quantity !== undefined) updates.quantity = data.quantity;
    if (data.specialInstructions !== undefined) updates.specialInstructions = data.specialInstructions;

    const [updated] = await db
      .update(cartItems)
      .set(updates)
      .where(eq(cartItems.id, lineId))
      .returning();

    return ok({ item: updated });
  } catch (err) {
    return fail(err);
  }
}

export async function DELETE(req: Request, ctx: Ctx) {
  try {
    const { id } = await ctx.params;
    const lineId = parseId(id);

    const actor = await requireAuth(req);

    const line = await db.query.cartItems.findFirst({ where: eq(cartItems.id, lineId) });
    if (!line) throw new ApiError(404, "Cart item not found", "NOT_FOUND");

    const cart = await db.query.carts.findFirst({ where: eq(carts.id, line.cartId) });
    if (!cart || cart.userId !== actor.id) throw new ApiError(403, "You do not own this cart", "FORBIDDEN");

    await db.delete(cartItems).where(eq(cartItems.id, lineId));
    return ok({ removed: true, id: lineId });
  } catch (err) {
    return fail(err);
  }
}
