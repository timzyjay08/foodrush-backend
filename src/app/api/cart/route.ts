import { db } from "@/db";
import { carts, cartItems, menuItems, restaurants } from "@/db/schema";
import { eq } from "drizzle-orm";
import { requireAuth } from "@/lib/auth";
import { ok, fail, round2 } from "@/lib/http";

export const dynamic = "force-dynamic";

async function getOrCreateCart(userId: number) {
  let cart = await db.query.carts.findFirst({ where: eq(carts.userId, userId) });
  if (!cart) {
    [cart] = await db.insert(carts).values({ userId }).returning();
  }
  return cart;
}

export async function GET(req: Request) {
  try {
    const actor = await requireAuth(req);
    const cart = await getOrCreateCart(actor.id);

    const items = await db.query.cartItems.findMany({ where: eq(cartItems.cartId, cart.id) });
    const enriched = await Promise.all(
      items.map(async (line) => {
        const item = await db.query.menuItems.findFirst({ where: eq(menuItems.id, line.menuItemId) });
        return { ...line, item };
      }),
    );

    const subtotal = round2(
      enriched.reduce((a, l) => a + ((l.item?.price ?? 0) + l.options.reduce((s, o) => s + o.price, 0)) * l.quantity, 0),
    );

    let restaurant = null;
    if (cart.restaurantId) {
      restaurant = await db.query.restaurants.findFirst({ where: eq(restaurants.id, cart.restaurantId) });
    }

    return ok({ cart, items: enriched, subtotal, restaurant });
  } catch (err) {
    return fail(err);
  }
}

export async function DELETE(req: Request) {
  try {
    const actor = await requireAuth(req);
    const cart = await getOrCreateCart(actor.id);
    await db.delete(cartItems).where(eq(cartItems.cartId, cart.id));
    await db.update(carts).set({ restaurantId: null, updatedAt: new Date() }).where(eq(carts.id, cart.id));
    return ok({ cleared: true });
  } catch (err) {
    return fail(err);
  }
}
