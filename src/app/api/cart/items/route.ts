import { db } from "@/db";
import { carts, cartItems, menuItems, foodItemOptions } from "@/db/schema";
import { eq, inArray } from "drizzle-orm";
import { requireAuth } from "@/lib/auth";
import { addCartItemSchema } from "@/lib/validators";
import { created, fail, ApiError, round2 } from "@/lib/http";

export const dynamic = "force-dynamic";

async function getOrCreateCart(userId: number) {
  let cart = await db.query.carts.findFirst({ where: eq(carts.userId, userId) });
  if (!cart) {
    [cart] = await db.insert(carts).values({ userId }).returning();
  }
  return cart;
}

export async function POST(req: Request) {
  try {
    const actor = await requireAuth(req);
    const body = await req.json();
    const data = addCartItemSchema.parse(body);

    const item = await db.query.menuItems.findFirst({ where: eq(menuItems.id, data.menuItemId) });
    if (!item) throw new ApiError(404, "Menu item not found", "NOT_FOUND");
    if (!item.isAvailable) throw new ApiError(409, `"${item.name}" is currently unavailable`, "ITEM_UNAVAILABLE");

    const cart = await getOrCreateCart(actor.id);

    // Single restaurant per cart: replace contents if switching restaurants.
    if (cart.restaurantId && cart.restaurantId !== item.restaurantId) {
      await db.delete(cartItems).where(eq(cartItems.cartId, cart.id));
    }

    // Resolve selected options server-side.
    const selectedIds = new Set(data.optionIds ?? []);
    let options: { name: string; price: number }[] = [];
    if (selectedIds.size > 0) {
      const rows = await db.query.foodItemOptions.findMany({
        where: inArray(foodItemOptions.id, [...selectedIds]),
      });
      options = rows
        .filter((o) => o.menuItemId === item.id)
        .map((o) => ({ name: o.name, price: round2(o.price) }));
    }

    // Merge into an existing line with identical menu item + options.
    const allLines = await db.query.cartItems.findMany({ where: eq(cartItems.cartId, cart.id) });
    const signature = JSON.stringify(options);
    const match = allLines.find((l) => l.menuItemId === item.id && JSON.stringify(l.options) === signature);

    if (match) {
      const [updated] = await db
        .update(cartItems)
        .set({ quantity: match.quantity + data.quantity, specialInstructions: data.specialInstructions ?? match.specialInstructions })
        .where(eq(cartItems.id, match.id))
        .returning();
      await db.update(carts).set({ restaurantId: item.restaurantId, updatedAt: new Date() }).where(eq(carts.id, cart.id));
      return created({ item: updated, merged: true });
    }

    const [line] = await db
      .insert(cartItems)
      .values({
        cartId: cart.id,
        menuItemId: item.id,
        quantity: data.quantity,
        options,
        specialInstructions: data.specialInstructions,
      })
      .returning();

    await db.update(carts).set({ restaurantId: item.restaurantId, updatedAt: new Date() }).where(eq(carts.id, cart.id));
    return created({ item: line, merged: false });
  } catch (err) {
    return fail(err);
  }
}
