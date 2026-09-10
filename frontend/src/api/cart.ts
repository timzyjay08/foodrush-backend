import { api } from "./client";
import type { CartLine } from "@/data/types";

/**
 * The cart is client-side for now (see useCart). These functions exist so a
 * server-side cart can be adopted without touching UI components.
 */

export async function getCart() {
  const { data } = await api.get<{
    items: Array<{
      menuItemId: number;
      quantity: number;
      item?: { name: string; price: number; imageUrl?: string; restaurant?: { id: number } };
    }>;
  }>("/cart");
  return data.items.map((line) => ({
    menuItemId: String(line.menuItemId),
    restaurantId: String(line.item?.restaurant?.id ?? ""),
    name: line.item?.name ?? "Menu item",
    price: line.item?.price ?? 0,
    imageUrl: line.item?.imageUrl ?? "",
    quantity: line.quantity,
  })) satisfies CartLine[];
}

export async function syncCart(lines: CartLine[]) {
  await clearRemoteCart();
  for (const line of lines) {
    await api.post("/cart/items", {
      menuItemId: Number(line.menuItemId),
      quantity: line.quantity,
      specialInstructions: line.note,
    });
  }
  return getCart();
}

export async function clearRemoteCart() {
  await api.delete("/cart");
}
