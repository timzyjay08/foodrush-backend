import { createFileRoute, Link } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { Bike, CheckCircle2, Clock, MapPin, Receipt } from "lucide-react";
import { AppShell } from "@/components/AppShell";
import { EmptyState } from "@/components/EmptyState";
import { OrderDetailSkeleton } from "@/components/skeletons";
import { readLastOrder } from "@/api/orders.local";
import type { Order } from "@/data/types";
import { formatDateTime, formatNaira, PAYMENT_LABELS } from "@/utils/format";

export const Route = createFileRoute("/order-confirmation")({
  head: () => ({
    meta: [
      { title: "Order confirmed — FoodRush" },
      {
        name: "description",
        content:
          "Your FoodRush order is confirmed. See your reference, delivery address and estimated arrival time.",
      },
      { property: "og:title", content: "Order confirmed — FoodRush" },
      { property: "og:description", content: "Your FoodRush order is on its way." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: OrderConfirmationPage,
});

function OrderConfirmationPage() {
  const [order, setOrder] = useState<Order | null>(null);
  const [loaded, setLoaded] = useState(false);

  useEffect(() => {
    setOrder(readLastOrder());
    setLoaded(true);
  }, []);

  if (!loaded) {
    return (
      <AppShell>
        <section className="container-page py-10 md:py-14">
          <div className="mx-auto max-w-2xl">
            <OrderDetailSkeleton />
          </div>
        </section>
      </AppShell>
    );
  }

  if (!order) {
    return (
      <AppShell>
        <section className="container-page py-12 md:py-16">
          <h1 className="font-display text-3xl font-extrabold tracking-tight">
            Order confirmation
          </h1>
          <div className="mt-8 max-w-xl">
            <EmptyState
              emoji="🧾"
              title="No recent order"
              description="We don't have a recent order in this browser. Place an order and its confirmation will show up here."
              action={
                <Link
                  to="/restaurants"
                  className="rounded-full bg-primary px-5 py-2.5 text-sm font-semibold text-primary-foreground shadow-glow"
                >
                  Browse restaurants
                </Link>
              }
            />
          </div>
        </section>
      </AppShell>
    );
  }

  return (
    <AppShell>
      <section className="container-page py-10 md:py-14">
        <div className="mx-auto max-w-2xl">
          <div className="rounded-3xl border border-border bg-card p-6 text-center shadow-lift">
            <span className="mx-auto grid size-16 place-items-center rounded-full bg-accent-soft text-accent">
              <CheckCircle2 className="size-9" aria-hidden />
            </span>
            <h1 className="mt-4 font-display text-2xl font-extrabold tracking-tight md:text-3xl">
              Order placed!
            </h1>
            <p className="mt-2 text-sm text-muted-foreground">
              {order.restaurantName} is getting your food ready.
            </p>
            <div className="mt-4 flex flex-wrap items-center justify-center gap-2">
              <span className="inline-flex items-center gap-1.5 rounded-full bg-primary-soft px-3 py-1 text-xs font-semibold text-primary">
                <Receipt className="size-3.5" aria-hidden /> {order.reference}
              </span>
              <span className="inline-flex items-center gap-1.5 rounded-full bg-muted px-3 py-1 text-xs font-semibold text-muted-foreground">
                <Clock className="size-3.5" aria-hidden /> Arriving in ~{order.etaMinutes} min
              </span>
              <span className="inline-flex items-center gap-1.5 rounded-full bg-muted px-3 py-1 text-xs font-semibold text-muted-foreground">
                <Bike className="size-3.5" aria-hidden /> {formatDateTime(order.placedAt)}
              </span>
            </div>
          </div>

          <div className="mt-4 grid gap-4 sm:grid-cols-2">
            <div className="rounded-3xl border border-border bg-card p-5 shadow-soft">
              <h2 className="font-display text-sm font-bold uppercase tracking-wide text-muted-foreground">
                Delivering to
              </h2>
              <p className="mt-2 flex items-start gap-2 text-sm">
                <MapPin className="mt-0.5 size-4 shrink-0 text-primary" aria-hidden />
                <span className="min-w-0">{order.address}</span>
              </p>
            </div>
            <div className="rounded-3xl border border-border bg-card p-5 shadow-soft">
              <h2 className="font-display text-sm font-bold uppercase tracking-wide text-muted-foreground">
                Payment
              </h2>
              <p className="mt-2 text-sm font-semibold">
                {order.paymentMethod ? PAYMENT_LABELS[order.paymentMethod] : "Card"}
              </p>
              <p className="mt-1 text-xs text-muted-foreground">{formatNaira(order.total)} total</p>
            </div>
          </div>

          <div className="mt-4 rounded-3xl border border-border bg-card p-5 shadow-soft">
            <h2 className="font-display text-lg font-bold">Order summary</h2>
            <ul className="mt-4 space-y-3 text-sm">
              {order.items.map((item, index) => (
                <li key={index} className="flex items-start justify-between gap-3">
                  <span className="min-w-0">
                    <span className="font-semibold">{item.quantity}×</span> {item.name}
                  </span>
                  <span className="shrink-0 font-semibold">
                    {formatNaira(item.price * item.quantity)}
                  </span>
                </li>
              ))}
            </ul>
            <dl className="mt-4 space-y-2 border-t border-border pt-4 text-sm">
              <Row label="Subtotal" value={formatNaira(order.subtotal)} />
              <Row label="Delivery fee" value={formatNaira(order.deliveryFee)} />
              <Row label="Service fee" value={formatNaira(order.serviceFee)} />
              <Row label="Total" value={formatNaira(order.total)} strong />
            </dl>
          </div>

          <div className="mt-6 grid gap-3 sm:grid-cols-3">
            <Link
              to="/orders/$id"
              params={{ id: order.id }}
              className="rounded-full bg-primary px-5 py-3 text-center text-sm font-bold text-primary-foreground shadow-glow"
            >
              Track my order
            </Link>
            <Link
              to="/orders"
              className="rounded-full border border-border px-5 py-3 text-center text-sm font-semibold hover:bg-muted"
            >
              View orders
            </Link>
            <Link
              to="/restaurants"
              className="rounded-full border border-border px-5 py-3 text-center text-sm font-semibold hover:bg-muted"
            >
              Continue shopping
            </Link>
          </div>
        </div>
      </section>
    </AppShell>
  );
}

function Row({ label, value, strong }: { label: string; value: string; strong?: boolean }) {
  return (
    <div
      className={`flex items-center justify-between gap-3 ${strong ? "text-base font-bold" : ""}`}
    >
      <dt className={strong ? "" : "text-muted-foreground"}>{label}</dt>
      <dd className="shrink-0">{value}</dd>
    </div>
  );
}
