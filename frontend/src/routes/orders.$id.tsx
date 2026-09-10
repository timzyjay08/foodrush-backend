import { createFileRoute, Link } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { ArrowLeft, Bike, Clock, MapPin, Receipt } from "lucide-react";
import { AppShell } from "@/components/AppShell";
import { EmptyState } from "@/components/EmptyState";
import { StatusBadge } from "@/components/StatusBadge";
import { readLastOrder, readOrdersHistory } from "@/api/orders.local";
import { mockOrders } from "@/data/mock";
import type { Order, PaymentMethod } from "@/data/types";
import { formatDateTime, formatNaira } from "@/utils/format";

const PAYMENT_LABELS: Record<PaymentMethod, string> = {
  card: "Card",
  transfer: "Bank transfer",
  cash: "Cash on delivery",
};

function paymentLabel(order: Order) {
  return order.paymentMethod
    ? (PAYMENT_LABELS[order.paymentMethod] ?? order.paymentMethod)
    : "Card";
}

function findOrder(key: string): Order | null {
  const needle = key.toLowerCase();
  const history = readOrdersHistory() ?? mockOrders;
  const last = readLastOrder();
  const pool = last ? [last, ...history] : history;
  return (
    pool.find(
      (order) =>
        order.id.toLowerCase() === needle || (order.reference ?? "").toLowerCase() === needle,
    ) ?? null
  );
}

export const Route = createFileRoute("/orders/$id")({
  head: () => ({
    meta: [
      { title: "Order details — FoodRush" },
      {
        name: "description",
        content:
          "See your FoodRush order details: items, delivery address, rider info and receipt.",
      },
      { property: "og:title", content: "Order details — FoodRush" },
      { property: "og:description", content: "Your FoodRush order details and receipt." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: OrderDetailPage,
});

function OrderDetailPage() {
  const { id } = Route.useParams();
  const [order, setOrder] = useState<Order | null>(null);
  const [loaded, setLoaded] = useState(false);

  useEffect(() => {
    setOrder(findOrder(id));
    setLoaded(true);
  }, [id]);

  if (!loaded) {
    return (
      <AppShell>
        <section className="container-page py-16">
          <div className="mx-auto h-8 w-8 animate-spin rounded-full border-2 border-primary border-t-transparent" />
        </section>
      </AppShell>
    );
  }

  if (!order) {
    return (
      <AppShell>
        <section className="container-page py-12 md:py-16">
          <BackLink />
          <h1 className="mt-4 font-display text-3xl font-extrabold tracking-tight">
            Order details
          </h1>
          <div className="mt-8 max-w-xl">
            <EmptyState
              emoji="🔍"
              title="Order not found"
              description="We couldn't find that order. It may have been placed on another device or cleared from this browser."
              action={
                <Link
                  to="/orders"
                  className="rounded-full bg-primary px-5 py-2.5 text-sm font-semibold text-primary-foreground shadow-glow"
                >
                  Back to orders
                </Link>
              }
            />
          </div>
        </section>
      </AppShell>
    );
  }

  const isClosed = order.status === "delivered" || order.status === "cancelled";

  return (
    <AppShell>
      <section className="container-page py-10 md:py-14">
        <div className="mx-auto max-w-2xl">
          <BackLink />

          <div className="mt-4 rounded-3xl border border-border bg-card p-5 shadow-soft md:p-6">
            <div className="flex flex-wrap items-center gap-2">
              <StatusBadge status={order.status} />
              <span className="inline-flex items-center gap-1.5 rounded-full bg-primary-soft px-3 py-1 text-xs font-semibold text-primary">
                <Receipt className="size-3.5" aria-hidden /> {order.reference}
              </span>
              <span className="inline-flex items-center gap-1.5 rounded-full bg-muted px-3 py-1 text-xs font-semibold text-muted-foreground">
                <Clock className="size-3.5" aria-hidden />
                {isClosed ? "Completed" : `ETA ${order.etaMinutes} min`}
              </span>
            </div>
            <div className="mt-4 flex items-center gap-3">
              {order.restaurantImage ? (
                <img
                  src={order.restaurantImage}
                  alt=""
                  className="size-14 rounded-2xl object-cover"
                />
              ) : null}
              <div>
                <h1 className="font-display text-xl font-extrabold tracking-tight md:text-2xl">
                  {order.restaurantName}
                </h1>
                <p className="text-xs text-muted-foreground">
                  Placed {formatDateTime(order.placedAt)}
                </p>
              </div>
            </div>
          </div>

          <div className="mt-4 grid gap-4 sm:grid-cols-2">
            <div className="rounded-3xl border border-border bg-card p-5 shadow-soft">
              <h2 className="font-display text-sm font-bold uppercase tracking-wide text-muted-foreground">
                Delivery
              </h2>
              <p className="mt-2 flex items-start gap-2 text-sm">
                <MapPin className="mt-0.5 size-4 shrink-0 text-primary" aria-hidden />
                <span>{order.address}</span>
              </p>
            </div>
            <div className="rounded-3xl border border-border bg-card p-5 shadow-soft">
              <h2 className="font-display text-sm font-bold uppercase tracking-wide text-muted-foreground">
                Payment
              </h2>
              <p className="mt-2 text-sm font-semibold">{paymentLabel(order)}</p>
              <p className="mt-1 text-xs text-muted-foreground">{formatNaira(order.total)} total</p>
            </div>
          </div>

          {order.rider && (
            <div className="mt-4 rounded-3xl border border-border bg-card p-5 shadow-soft">
              <h2 className="flex items-center gap-2 font-display text-sm font-bold uppercase tracking-wide text-muted-foreground">
                <Bike className="size-4 text-primary" aria-hidden /> Rider
              </h2>
              <p className="mt-2 text-sm">
                <span className="font-semibold">{order.rider.name}</span> · {order.rider.vehicle}
              </p>
              <p className="text-xs text-muted-foreground">{order.rider.phone}</p>
            </div>
          )}

          <div className="mt-4 rounded-3xl border border-border bg-card p-5 shadow-soft">
            <h2 className="font-display text-lg font-bold">Order summary</h2>
            <ul className="mt-4 space-y-3 text-sm">
              {order.items.map((item, index) => (
                <li key={index} className="flex items-start justify-between gap-3">
                  <span>
                    <span className="font-semibold">{item.quantity}×</span> {item.name}
                    <span className="block text-xs text-muted-foreground">
                      {formatNaira(item.price)} each
                    </span>
                  </span>
                  <span className="shrink-0 font-semibold">
                    {formatNaira(item.price * item.quantity)}
                  </span>
                </li>
              ))}
            </ul>
            <dl className="mt-4 space-y-2 border-t border-border pt-4 text-sm">
              <div className="flex items-center justify-between">
                <dt className="text-muted-foreground">Subtotal</dt>
                <dd>{formatNaira(order.subtotal)}</dd>
              </div>
              <div className="flex items-center justify-between">
                <dt className="text-muted-foreground">Delivery fee</dt>
                <dd>{formatNaira(order.deliveryFee)}</dd>
              </div>
              <div className="flex items-center justify-between">
                <dt className="text-muted-foreground">Service fee</dt>
                <dd>{formatNaira(order.serviceFee)}</dd>
              </div>
              <div className="flex items-center justify-between border-t border-border pt-2 text-base font-bold">
                <dt>Total</dt>
                <dd>{formatNaira(order.total)}</dd>
              </div>
            </dl>
          </div>

          <div className="mt-6 flex flex-col gap-3 sm:flex-row">
            <Link
              to="/orders"
              className="inline-flex flex-1 items-center justify-center gap-2 rounded-full border border-border bg-card px-5 py-3.5 text-sm font-bold transition-colors hover:bg-muted"
            >
              All orders
            </Link>
            <Link
              to="/restaurants"
              className="inline-flex flex-1 items-center justify-center gap-2 rounded-full bg-primary px-5 py-3.5 text-sm font-bold text-primary-foreground shadow-glow transition-transform hover:-translate-y-0.5"
            >
              Order more food
            </Link>
          </div>
        </div>
      </section>
    </AppShell>
  );
}

function BackLink() {
  return (
    <Link
      to="/orders"
      className="inline-flex items-center gap-1.5 text-sm font-semibold text-muted-foreground transition-colors hover:text-foreground"
    >
      <ArrowLeft className="size-4" aria-hidden /> Back to orders
    </Link>
  );
}
