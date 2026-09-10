import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { Clock } from "lucide-react";
import { AppShell } from "@/components/AppShell";
import { CartItem } from "@/components/CartItem";
import { EmptyState } from "@/components/EmptyState";
import { restaurantQuery } from "@/hooks/queries";
import { useCart } from "@/hooks/useCart";
import { feedback } from "@/lib/feedback";
import { formatDeliveryWindow, formatNaira } from "@/utils/format";

export const Route = createFileRoute("/cart")({
  head: () => ({
    meta: [
      { title: "Your cart — FoodRush" },
      {
        name: "description",
        content:
          "Review your Lagos food order, adjust quantities and see delivery and service fees before checkout.",
      },
      { property: "og:title", content: "Your cart — FoodRush" },
      {
        property: "og:description",
        content: "Review your order and head to checkout on FoodRush.",
      },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: CartPage,
});

function CartPage() {
  const cart = useCart();
  const restaurant = useQuery({
    ...restaurantQuery(cart.restaurantId ?? ""),
    enabled: Boolean(cart.restaurantId),
  });

  const deliveryFee = cart.lines.length ? (restaurant.data?.deliveryFee ?? 800) : 0;
  const total = cart.subtotal + cart.serviceFee + deliveryFee;

  function removeLine(menuItemId: string, name: string) {
    try {
      cart.removeItem(menuItemId);
      feedback.removedFromCart(name);
    } catch {
      feedback.error("We couldn't update your cart. Please try again.");
    }
  }

  function changeQuantity(menuItemId: string, quantity: number, name: string) {
    try {
      cart.setQuantity(menuItemId, quantity);
      if (quantity <= 0) feedback.removedFromCart(name);
    } catch {
      feedback.error("We couldn't update your cart. Please try again.");
    }
  }

  function clearCart() {
    try {
      cart.clear();
      feedback.info("Cart cleared", "Your cart is empty again.");
    } catch {
      feedback.error("We couldn't clear your cart. Please try again.");
    }
  }

  if (cart.lines.length === 0) {
    return (
      <AppShell>
        <section className="container-page py-12 md:py-16">
          <h1 className="font-display text-3xl font-extrabold tracking-tight">Your cart</h1>
          <div className="mt-8">
            <EmptyState
              emoji="🛍️"
              title="Your cart is empty"
              description="Add jollof, suya or shawarma from a kitchen near you and it will show up here."
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
      <section className="container-page grid gap-8 py-10 md:py-14 lg:grid-cols-[1fr_360px]">
        <div className="min-w-0">
          <h1 className="font-display text-3xl font-extrabold tracking-tight">Your cart</h1>
          {restaurant.isPending && cart.restaurantId ? (
            <div className="mt-2 h-5 w-56 animate-pulse rounded-full bg-muted" />
          ) : (
            restaurant.data && (
              <p className="mt-2 flex flex-wrap items-center gap-2 text-sm text-muted-foreground">
                From <span className="font-semibold text-foreground">{restaurant.data.name}</span>
                <span className="inline-flex items-center gap-1 rounded-full bg-muted px-2.5 py-1">
                  <Clock className="size-3.5" aria-hidden />
                  {formatDeliveryWindow(restaurant.data.deliveryMinutes)}
                </span>
              </p>
            )
          )}

          <ul className="mt-4 divide-y divide-border">
            {cart.lines.map((line) => (
              <CartItem
                key={line.menuItemId}
                line={line}
                onQuantityChange={(quantity) =>
                  changeQuantity(line.menuItemId, quantity, line.name)
                }
                onRemove={() => removeLine(line.menuItemId, line.name)}
              />
            ))}
          </ul>

          <button
            type="button"
            onClick={clearCart}
            className="mt-5 text-sm font-semibold text-muted-foreground underline-offset-4 hover:text-destructive hover:underline"
          >
            Clear cart
          </button>
        </div>

        <aside className="min-w-0">
          <div className="sticky top-24 rounded-3xl border border-border bg-card p-5 shadow-soft">
            <h2 className="font-display text-lg font-bold">Order summary</h2>
            <dl className="mt-4 space-y-2.5 text-sm">
              <SummaryRow
                label={`Subtotal (${cart.count} items)`}
                value={formatNaira(cart.subtotal)}
              />
              <SummaryRow label="Delivery fee" value={formatNaira(deliveryFee)} />
              <SummaryRow label="Service fee" value={formatNaira(cart.serviceFee)} />
              <div className="border-t border-border pt-3">
                <SummaryRow label="Total" value={formatNaira(total)} strong />
              </div>
            </dl>
            <p className="mt-3 text-xs text-muted-foreground">
              Estimated delivery{" "}
              {restaurant.data
                ? formatDeliveryWindow(restaurant.data.deliveryMinutes)
                : "25–40 min"}
            </p>
            <Link
              to="/checkout"
              className="mt-5 block rounded-full bg-primary px-5 py-3.5 text-center text-sm font-bold text-primary-foreground shadow-glow transition-transform hover:-translate-y-0.5"
            >
              Checkout · {formatNaira(total)}
            </Link>
            <Link
              to="/restaurants"
              className="mt-3 block rounded-full border border-border px-5 py-3 text-center text-sm font-semibold hover:bg-muted"
            >
              Add more items
            </Link>
          </div>
        </aside>
      </section>
    </AppShell>
  );
}

function SummaryRow({ label, value, strong }: { label: string; value: string; strong?: boolean }) {
  return (
    <div
      className={`flex items-center justify-between gap-3 ${strong ? "text-base font-bold" : ""}`}
    >
      <dt className={strong ? "" : "text-muted-foreground"}>{label}</dt>
      <dd className="shrink-0">{value}</dd>
    </div>
  );
}
