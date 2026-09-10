import { api } from "./client";
import type { Order } from "@/data/types";
import type { OrderDraft } from "./orders.local";

export type PlaceOrderPayload = {
  restaurantId: string;
  items: { menuItemId: string; quantity: number; note?: string }[];
  deliveryAddress: string;
  fulfilment: "delivery" | "pickup";
  paymentMethod: string;
  note?: string;
};

export async function getOrders() {
  const { data } = await api.get<BackendOrder[]>("/orders");
  return data.map(toOrder);
}

export async function getOrder(id: string) {
  const { data } = await api.get<{ order: BackendOrder }>(`/orders/${id}`);
  return toOrder(data.order);
}

export async function placeOrder(payload: PlaceOrderPayload) {
  const { data } = await api.post<{ order: BackendOrder }>("/orders", {
    restaurantId: Number(payload.restaurantId),
    items: payload.items.map((item) => ({
      menuItemId: Number(item.menuItemId),
      quantity: item.quantity,
      specialInstructions: item.note,
    })),
    deliveryAddress: payload.deliveryAddress,
    paymentMethod: payload.paymentMethod,
    note: payload.note,
  });
  return toOrder(data.order);
}

export async function cancelOrder(id: string) {
  const { data } = await api.patch<BackendOrder>(`/orders/${id}/cancel`);
  return toOrder(data);
}

/**
 * Order submission used by /checkout.
 *
 * Today it creates the order locally (demo mock persistence) so the customer
 * flow works end to end. Backend integration = replace the body with:
 *
 *   return placeOrder(payload)
 *
 * and keep the same return type (Order).
 */
export async function submitOrder(draft: OrderDraft): Promise<Order> {
  return placeOrder({
    restaurantId: draft.restaurantId,
    items: draft.items.map((item) => ({ menuItemId: item.menuItemId, quantity: item.quantity })),
    deliveryAddress: draft.address,
    fulfilment: "delivery",
    paymentMethod: draft.paymentMethod,
  });
}

type BackendOrder = {
  id: number;
  restaurantId: number;
  status: string;
  createdAt: string;
  subtotal: number;
  deliveryFee: number;
  serviceFee: number;
  total: number;
  deliveryAddress: string;
  paymentMethod?: string;
  items?: Array<{ name: string; price: number; quantity: number }>;
};

function toOrder(order: BackendOrder): Order {
  return {
    id: String(order.id),
    reference: `FR-${order.id}`,
    restaurantId: String(order.restaurantId),
    restaurantName: "FoodRush kitchen",
    restaurantImage: "",
    status: order.status.toLowerCase() as Order["status"],
    placedAt: order.createdAt,
    etaMinutes: 35,
    items: order.items ?? [],
    subtotal: order.subtotal,
    deliveryFee: order.deliveryFee,
    serviceFee: order.serviceFee,
    total: order.total,
    address: order.deliveryAddress,
    paymentMethod: order.paymentMethod as Order["paymentMethod"],
  };
}
