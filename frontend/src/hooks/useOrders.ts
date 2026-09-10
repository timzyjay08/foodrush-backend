import { useCallback, useEffect, useState } from "react";
import { ORDERS_HISTORY_KEY, readLastOrder, readOrdersHistory } from "@/api/orders.local";
import { mockOrders } from "@/data/mock";
import type { Order } from "@/data/types";

/**
 * Customer order history for /orders and /orders/$id.
 *
 * Backed by the demo localStorage layer in src/api/orders.local.ts, so orders
 * created at checkout survive a refresh. Demo history is seeded ONCE (only when
 * the storage key is absent) — never on every render.
 */

const keyOf = (order: Order) => order.reference || order.id;

function dedupe(orders: Order[]): Order[] {
  const seen = new Set<string>();
  return orders.filter((order) => {
    const key = keyOf(order);
    if (seen.has(key)) return false;
    seen.add(key);
    return true;
  });
}

function loadOrders(): Order[] {
  const stored = readOrdersHistory();
  let history: Order[];

  if (stored === null) {
    history = [...mockOrders];
    try {
      window.localStorage.setItem(ORDERS_HISTORY_KEY, JSON.stringify(history));
    } catch {
      /* storage unavailable */
    }
  } else {
    history = stored;
  }

  const last = readLastOrder();
  const merged = last ? [last, ...history] : history;
  return dedupe(merged).sort(
    (a, b) => new Date(b.placedAt).getTime() - new Date(a.placedAt).getTime(),
  );
}

export function useOrders() {
  const [orders, setOrders] = useState<Order[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isError, setIsError] = useState(false);

  const load = useCallback(() => {
    setIsLoading(true);
    try {
      setOrders(loadOrders());
      setIsError(false);
    } catch {
      setIsError(true);
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  return { orders, isLoading, isError, refetch: load };
}

/** Single order lookup by id OR reference (case-insensitive). */
export function useOrder(key: string) {
  const [order, setOrder] = useState<Order | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isError, setIsError] = useState(false);

  const load = useCallback(() => {
    setIsLoading(true);
    try {
      const needle = key.trim().toLowerCase();
      const found =
        loadOrders().find(
          (item) =>
            item.id.toLowerCase() === needle || (item.reference ?? "").toLowerCase() === needle,
        ) ?? null;
      setOrder(found);
      setIsError(false);
    } catch {
      setIsError(true);
    } finally {
      setIsLoading(false);
    }
  }, [key]);

  useEffect(() => {
    load();
  }, [load]);

  return { order, isLoading, isError, refetch: load };
}
