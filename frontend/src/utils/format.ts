import type { OrderStatus, PaymentMethod } from "@/data/types";

export const PAYMENT_LABELS: Record<PaymentMethod, string> = {
  card: "Card",
  transfer: "Bank transfer",
  cash: "Cash on delivery",
};

const naira = new Intl.NumberFormat("en-NG", {
  style: "currency",
  currency: "NGN",
  maximumFractionDigits: 0,
});

export function formatNaira(amount: number) {
  return naira.format(amount);
}

export function formatDeliveryWindow([min, max]: [number, number]) {
  return `${min}–${max} min`;
}

export function formatDateTime(iso: string) {
  return new Date(iso).toLocaleString("en-NG", {
    day: "numeric",
    month: "short",
    hour: "2-digit",
    minute: "2-digit",
  });
}

export const ORDER_STATUS_META: Record<
  OrderStatus,
  { label: string; tone: "neutral" | "info" | "success" | "warning" | "danger"; step: number }
> = {
  pending: { label: "Awaiting confirmation", tone: "neutral", step: 0 },
  confirmed: { label: "Order confirmed", tone: "info", step: 1 },
  preparing: { label: "Being prepared", tone: "warning", step: 2 },
  on_the_way: { label: "On the way", tone: "info", step: 3 },
  delivered: { label: "Delivered", tone: "success", step: 4 },
  cancelled: { label: "Cancelled", tone: "danger", step: 4 },
};

export function initials(name: string) {
  return name
    .split(" ")
    .slice(0, 2)
    .map((part) => part[0]?.toUpperCase() ?? "")
    .join("");
}
