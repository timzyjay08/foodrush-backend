import type { Order, OrderStatus, PaymentMethod } from "@/data/types";

/**
 * Demo-only order persistence.
 *
 * The customer flow (checkout → confirmation → /orders) is backed by
 * localStorage until the existing Spring Boot endpoints in ./orders.ts are
 * wired up. Nothing outside this module touches these keys except the pages
 * that already read them.
 */
export const LAST_ORDER_KEY = "foodrush.lastOrder";
export const ORDERS_HISTORY_KEY = "foodrush.ordersHistory";

export type OrderDraft = {
  restaurantId: string;
  restaurantName: string;
  restaurantImage: string;
  items: { menuItemId: string; name: string; quantity: number; price: number }[];
  subtotal: number;
  deliveryFee: number;
  serviceFee: number;
  total: number;
  address: string;
  paymentMethod: PaymentMethod;
  etaMinutes: number;
};

const INITIAL_STATUS: OrderStatus = "confirmed";

function reference() {
  return `FR-${Math.floor(100000 + Math.random() * 899999)}`;
}

export function buildOrder(draft: OrderDraft): Order {
  const ref = reference();
  return {
    id: ref.toLowerCase(),
    reference: ref,
    restaurantId: draft.restaurantId,
    restaurantName: draft.restaurantName,
    restaurantImage: draft.restaurantImage,
    status: INITIAL_STATUS,
    placedAt: new Date().toISOString(),
    etaMinutes: draft.etaMinutes,
    items: draft.items,
    subtotal: draft.subtotal,
    deliveryFee: draft.deliveryFee,
    serviceFee: draft.serviceFee,
    total: draft.total,
    address: draft.address,
    paymentMethod: draft.paymentMethod,
  };
}

export function readOrdersHistory(): Order[] | null {
  try {
    const raw = window.localStorage.getItem(ORDERS_HISTORY_KEY);
    if (raw === null) return null;
    const parsed = JSON.parse(raw) as Order[];
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

export function readLastOrder(): Order | null {
  try {
    const raw = window.localStorage.getItem(LAST_ORDER_KEY);
    return raw ? (JSON.parse(raw) as Order) : null;
  } catch {
    return null;
  }
}

const keyOf = (order: Order) => order.reference || order.id;

/** Writes the order as the latest order and prepends it to history (deduped). */
export function persistOrder(order: Order) {
  const history = readOrdersHistory() ?? [];
  const next = [order, ...history.filter((item) => keyOf(item) !== keyOf(order))];
  window.localStorage.setItem(ORDERS_HISTORY_KEY, JSON.stringify(next));
  window.localStorage.setItem(LAST_ORDER_KEY, JSON.stringify(order));
}
