import { useState } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { useNavigate } from "@tanstack/react-router";
import { menuQuery } from "@/hooks/queries";
import { useCart } from "@/hooks/useCart";
import { feedback } from "@/lib/feedback";
import type { Order } from "@/data/types";

/**
 * "Order again" — rebuilds a cart from a past order by matching the order's
 * item names against the restaurant's current menu (order lines only store
 * name/quantity/price, so the menu lookup is what makes real cart lines).
 * Items that are no longer on the menu are skipped instead of faked.
 */
export function useReorder() {
  const queryClient = useQueryClient();
  const cart = useCart();
  const navigate = useNavigate();
  const [pendingId, setPendingId] = useState<string | null>(null);

  async function reorder(order: Order) {
    if (pendingId) return;
    setPendingId(order.id);
    try {
      const menu = await queryClient.fetchQuery(menuQuery(order.restaurantId));
      const byName = new Map(menu.map((item) => [item.name.toLowerCase(), item]));

      let added = 0;
      cart.clear();
      for (const line of order.items) {
        const match = byName.get(line.name.toLowerCase());
        if (!match) continue;
        cart.addItem(match, line.quantity);
        added += 1;
      }

      if (added === 0) {
        feedback.error("None of those dishes are on the menu right now.");
        return;
      }

      const skipped = order.items.length - added;
      feedback.info(
        added === order.items.length
          ? "Added to your cart"
          : `${added} of ${order.items.length} dishes added`,
        skipped ? "Some dishes are no longer on the menu." : `From ${order.restaurantName}`,
      );
      await navigate({ to: "/cart" });
    } catch {
      feedback.error("We couldn't rebuild that order. Please try again.");
    } finally {
      setPendingId(null);
    }
  }

  return { reorder, pendingId, isReordering: (id: string) => pendingId === id };
}
