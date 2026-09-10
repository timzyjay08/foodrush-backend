import { createFileRoute, Link, notFound } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { ArrowLeft, Bike, Clock, Heart, MapPin, ShoppingBag, Star } from "lucide-react";
import { useMemo } from "react";
import { AppShell } from "@/components/AppShell";
import { EmptyState } from "@/components/EmptyState";
import { FoodCard } from "@/components/FoodCard";
import type { MenuItem } from "@/data/types";
import { ErrorState } from "@/components/ErrorState";
import { MenuItemSkeletonList } from "@/components/skeletons";
import { feedback } from "@/lib/feedback";
import { menuQuery, restaurantQuery } from "@/hooks/queries";
import { useCart } from "@/hooks/useCart";
import { useFavorites } from "@/hooks/useFavorites";
import { formatDeliveryWindow, formatNaira } from "@/utils/format";

export const Route = createFileRoute("/restaurants/$id")({
  loader: async ({ context, params }) => {
    const restaurant = await context.queryClient.ensureQueryData(restaurantQuery(params.id));
    if (!restaurant) throw notFound();
    return { restaurant };
  },
  head: ({ loaderData }) => {
    if (!loaderData) {
      return {
        meta: [
          { title: "Restaurant unavailable — FoodRush" },
          { name: "robots", content: "noindex" },
        ],
      };
    }
    const { restaurant } = loaderData;
    const title = `${restaurant.name} — order on FoodRush`;
    const description = `${restaurant.tagline}. Delivery from ${restaurant.area} in ${formatDeliveryWindow(restaurant.deliveryMinutes)}.`;
    return {
      meta: [
        { title },
        { name: "description", content: description },
        { property: "og:title", content: title },
        { property: "og:description", content: description },
        { property: "og:type", content: "website" },
        { name: "twitter:card", content: "summary_large_image" },
      ],
    };
  },
  notFoundComponent: () => (
    <AppShell>
      <div className="container-page py-16">
        <EmptyState
          emoji="🚫"
          title="Kitchen not found"
          description="This restaurant may have closed or the link is wrong."
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
    </AppShell>
  ),
  component: RestaurantDetail,
});

function RestaurantDetail() {
  const { restaurant } = Route.useLoaderData();
  const menu = useQuery(menuQuery(restaurant.id));
  const cart = useCart();
  const favorites = useFavorites();

  const sections = useMemo(() => {
    const groups = new Map<string, MenuItem[]>();
    for (const item of menu.data ?? []) {
      const list = groups.get(item.section) ?? [];
      list.push(item);
      groups.set(item.section, list);
    }
    return [...groups.entries()];
  }, [menu.data]);

  function addToCart(item: MenuItem) {
    try {
      cart.addItem(item);
      feedback.addedToCart(item.name);
    } catch {
      feedback.error("We couldn't add that dish. Please try again.");
    }
  }

  const deliveryTotal =
    cart.subtotal + cart.serviceFee + (cart.lines.length ? restaurant.deliveryFee : 0);

  return (
    <AppShell>
      <section className="relative">
        <div className="relative h-56 overflow-hidden md:h-72">
          <img
            src={restaurant.imageUrl}
            alt={`${restaurant.name} kitchen`}
            className="size-full object-cover"
          />
          <div className="absolute inset-0 bg-gradient-to-t from-ink/85 via-ink/30 to-transparent" />
          <Link
            to="/restaurants"
            className="absolute left-4 top-4 inline-flex items-center gap-1.5 rounded-full bg-card/90 px-3 py-2 text-sm font-semibold shadow-soft"
          >
            <ArrowLeft className="size-4" aria-hidden /> Back
          </Link>
          <button
            type="button"
            onClick={() => favorites.toggle(restaurant.id)}
            aria-pressed={favorites.isFavorite(restaurant.id)}
            aria-label={`Save ${restaurant.name}`}
            className="absolute right-4 top-4 grid size-10 place-items-center rounded-full bg-card/90 shadow-soft"
          >
            <Heart
              className={`size-5 ${favorites.isFavorite(restaurant.id) ? "fill-primary text-primary" : ""}`}
              aria-hidden
            />
          </button>
        </div>

        <div className="container-page -mt-16 relative">
          <div className="rounded-3xl border border-border bg-card p-5 shadow-lift md:p-7">
            <div className="flex flex-wrap items-start justify-between gap-4">
              <div>
                <h1 className="font-display text-2xl font-extrabold tracking-tight md:text-3xl">
                  {restaurant.name}
                </h1>
                <p className="mt-1 text-muted-foreground">{restaurant.tagline}</p>
              </div>
              <span className="flex items-center gap-1.5 rounded-full bg-accent-soft px-3 py-1.5 text-sm font-bold text-accent">
                <Star className="size-4 fill-current" aria-hidden />
                {restaurant.rating.toFixed(1)}
                <span className="font-medium text-muted-foreground">
                  ({restaurant.reviewCount})
                </span>
              </span>
            </div>

            <dl className="mt-5 grid grid-cols-2 gap-4 text-sm md:grid-cols-4">
              <Meta
                icon={Clock}
                label="Delivery"
                value={formatDeliveryWindow(restaurant.deliveryMinutes)}
              />
              <Meta icon={Bike} label="Delivery fee" value={formatNaira(restaurant.deliveryFee)} />
              <Meta icon={ShoppingBag} label="Min order" value={formatNaira(restaurant.minOrder)} />
              <Meta
                icon={MapPin}
                label="Area"
                value={`${restaurant.area} · ${restaurant.distanceKm}km`}
              />
            </dl>

            {!restaurant.isOpen && (
              <p className="mt-5 rounded-2xl bg-muted px-4 py-3 text-sm font-semibold text-muted-foreground">
                This kitchen is currently closed — you can still browse the menu.
              </p>
            )}
          </div>
        </div>
      </section>

      <section className="container-page grid gap-8 py-10 lg:grid-cols-[1fr_320px]">
        <div className="space-y-10">
          {menu.isPending && (
            <div className="space-y-4">
              <div className="h-6 w-40 animate-pulse rounded-full bg-muted" />
              <MenuItemSkeletonList count={4} />
            </div>
          )}

          {menu.isError && (
            <ErrorState
              title="We couldn't load this menu"
              description="The kitchen's menu didn't come through. Please try again."
              onRetry={() => void menu.refetch()}
            />
          )}

          {!menu.isPending && !menu.isError && sections.length === 0 && (
            <EmptyState
              emoji="📋"
              title="No dishes listed yet"
              description="This kitchen hasn't published its menu. Try another restaurant in the meantime."
              action={
                <Link
                  to="/restaurants"
                  className="rounded-full bg-primary px-5 py-2.5 text-sm font-semibold text-primary-foreground shadow-glow"
                >
                  Browse restaurants
                </Link>
              }
            />
          )}
          {sections.map(([section, items]) => (
            <div key={section}>
              <h2 className="font-display text-xl font-bold">{section}</h2>
              <div className="mt-4 grid gap-4 sm:grid-cols-2 lg:grid-cols-1 xl:grid-cols-2">
                {items.map((item) => (
                  <FoodCard
                    key={item.id}
                    item={item}
                    onSelect={(selected) => addToCart(selected)}
                  />
                ))}
              </div>
            </div>
          ))}
        </div>

        <aside className="hidden lg:block">
          <div className="sticky top-24 rounded-3xl border border-border bg-card p-5 shadow-soft">
            <h2 className="font-display text-lg font-bold">Your order</h2>
            {cart.lines.length === 0 ? (
              <p className="mt-3 text-sm text-muted-foreground">
                Nothing added yet. Tap the + on any dish to start your order.
              </p>
            ) : (
              <>
                <ul className="mt-4 space-y-3">
                  {cart.lines.map((line) => (
                    <li
                      key={line.menuItemId}
                      className="flex items-start justify-between gap-3 text-sm"
                    >
                      <span className="min-w-0">
                        <span className="font-semibold">{line.quantity}×</span> {line.name}
                      </span>
                      <span className="shrink-0 font-semibold">
                        {formatNaira(line.price * line.quantity)}
                      </span>
                    </li>
                  ))}
                </ul>
                <dl className="mt-5 space-y-2 border-t border-border pt-4 text-sm">
                  <Row label="Subtotal" value={formatNaira(cart.subtotal)} />
                  <Row label="Delivery" value={formatNaira(restaurant.deliveryFee)} />
                  <Row label="Service fee" value={formatNaira(cart.serviceFee)} />
                  <Row label="Total" value={formatNaira(deliveryTotal)} strong />
                </dl>
                <Link
                  to="/cart"
                  className="mt-5 block rounded-full bg-primary px-5 py-3 text-center text-sm font-semibold text-primary-foreground shadow-glow"
                >
                  Go to cart
                </Link>
              </>
            )}
          </div>
        </aside>
      </section>

      {cart.count > 0 && (
        <div className="fixed inset-x-0 bottom-16 z-30 px-4 pb-2 lg:hidden">
          <Link
            to="/cart"
            className="flex items-center justify-between gap-3 rounded-full bg-primary px-5 py-4 text-sm font-semibold text-primary-foreground shadow-lift"
          >
            <span className="flex items-center gap-2">
              <ShoppingBag className="size-4" aria-hidden /> {cart.count} item
              {cart.count === 1 ? "" : "s"}
            </span>
            <span>{formatNaira(cart.subtotal)} · View cart</span>
          </Link>
        </div>
      )}
    </AppShell>
  );
}

function Meta({ icon: Icon, label, value }: { icon: typeof Clock; label: string; value: string }) {
  return (
    <div className="rounded-2xl bg-muted/60 px-3 py-2.5">
      <dt className="flex items-center gap-1.5 text-xs text-muted-foreground">
        <Icon className="size-3.5" aria-hidden /> {label}
      </dt>
      <dd className="mt-0.5 font-semibold">{value}</dd>
    </div>
  );
}

function Row({ label, value, strong }: { label: string; value: string; strong?: boolean }) {
  return (
    <div className={`flex items-center justify-between ${strong ? "text-base font-bold" : ""}`}>
      <dt className={strong ? "" : "text-muted-foreground"}>{label}</dt>
      <dd>{value}</dd>
    </div>
  );
}
