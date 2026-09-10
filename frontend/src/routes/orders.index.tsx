import { createFileRoute, Link } from "@tanstack/react-router";
import { Loader2, RotateCcw } from "lucide-react";
import { AppShell } from "@/components/AppShell";
import { EmptyState } from "@/components/EmptyState";
import { ErrorState } from "@/components/ErrorState";
import { OrderCard } from "@/components/OrderCard";
import { OrderCardSkeletonList } from "@/components/skeletons";
import { useOrders } from "@/hooks/useOrders";
import { useReorder } from "@/hooks/useReorder";

export const Route = createFileRoute("/orders/")({
  head: () => ({
    meta: [
      { title: "Your orders — FoodRush" },
      {
        name: "description",
        content:
          "Every FoodRush order you've placed: references, totals, delivery addresses and live status.",
      },
      { property: "og:title", content: "Your orders — FoodRush" },
      { property: "og:description", content: "Track and revisit your FoodRush orders." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: OrdersPage,
});

function OrdersPage() {
  const { orders, isLoading, isError, refetch } = useOrders();
  const { reorder, isReordering, pendingId } = useReorder();

  return (
    <AppShell>
      <section className="container-page py-10 md:py-14">
        <div className="flex flex-wrap items-end justify-between gap-4">
          <div>
            <h1 className="font-display text-3xl font-extrabold tracking-tight">Your orders</h1>
            <p className="mt-2 text-sm text-muted-foreground">
              Newest first — tap an order to follow its delivery.
            </p>
          </div>
          <Link
            to="/restaurants"
            className="rounded-full border border-border px-4 py-2.5 text-sm font-semibold hover:bg-muted"
          >
            Browse restaurants
          </Link>
        </div>

        <div className="mt-8">
          {isLoading ? (
            <OrderCardSkeletonList count={3} />
          ) : isError ? (
            <ErrorState
              title="We couldn't load your orders"
              description="Your order history didn't come through. Please try again."
              onRetry={refetch}
            />
          ) : orders.length === 0 ? (
            <EmptyState
              emoji="🧾"
              title="No orders yet"
              description="Once you place your first FoodRush order it will appear here with its full receipt."
              action={
                <Link
                  to="/restaurants"
                  className="rounded-full bg-primary px-5 py-2.5 text-sm font-semibold text-primary-foreground shadow-glow"
                >
                  Order something
                </Link>
              }
            />
          ) : (
            <div className="space-y-4">
              {orders.map((order) => (
                <OrderCard
                  key={order.id}
                  order={order}
                  actions={
                    <button
                      type="button"
                      onClick={() => void reorder(order)}
                      disabled={Boolean(pendingId)}
                      aria-busy={isReordering(order.id)}
                      className="inline-flex items-center gap-1.5 rounded-full bg-primary px-4 py-2 text-xs font-semibold text-primary-foreground shadow-glow disabled:opacity-70"
                    >
                      {isReordering(order.id) ? (
                        <Loader2 className="size-3.5 animate-spin" aria-hidden />
                      ) : (
                        <RotateCcw className="size-3.5" aria-hidden />
                      )}
                      Order again
                    </button>
                  }
                />
              ))}
            </div>
          )}
        </div>
      </section>
    </AppShell>
  );
}
