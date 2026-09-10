import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useSuspenseQuery } from "@tanstack/react-query";
import { ArrowRight, MapPin, Search, ShieldCheck, Timer, Utensils } from "lucide-react";
import { Suspense, useState } from "react";
import { AppShell } from "@/components/AppShell";
import { CardSkeletonGrid } from "@/components/EmptyState";
import { CategoryChip } from "@/components/CategoryChip";
import { RestaurantCard } from "@/components/RestaurantCard";
import { categoriesQuery, popularItemsQuery, restaurantsQuery } from "@/hooks/queries";
import { useFavorites } from "@/hooks/useFavorites";
import { images } from "@/data/mock";
import { formatNaira } from "@/utils/format";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "FoodRush — Hot Lagos meals delivered in minutes" },
      {
        name: "description",
        content:
          "Order jollof, suya, shawarma and more from top Lagos kitchens. Live tracking, fast riders, fair prices.",
      },
      { property: "og:title", content: "FoodRush — Hot Lagos meals delivered in minutes" },
      {
        property: "og:description",
        content: "Order from the best kitchens near you and track your rider in real time.",
      },
    ],
  }),
  loader: ({ context }) =>
    Promise.all([
      context.queryClient.ensureQueryData(restaurantsQuery({ sort: "delivery-time" })),
      context.queryClient.ensureQueryData(categoriesQuery()),
    ]),
  component: HomePage,
});

function HomePage() {
  return (
    <AppShell>
      <Hero />
      <Categories />
      <Suspense
        fallback={
          <div className="container-page py-10">
            <CardSkeletonGrid count={3} />
          </div>
        }
      >
        <FastestNearYou />
        <PopularDishes />
      </Suspense>
      <HowItWorks />
    </AppShell>
  );
}

function Hero() {
  const navigate = useNavigate();
  const [term, setTerm] = useState("");

  return (
    <section className="relative overflow-hidden bg-ink text-ink-foreground">
      <img
        src={images.heroJollof}
        alt="Smoky party jollof rice served with grilled chicken"
        className="absolute inset-0 size-full object-cover opacity-40"
      />
      <div className="absolute inset-0 bg-gradient-to-r from-ink via-ink/85 to-ink/30" />
      <div className="container-page relative grid gap-10 py-16 md:py-24 lg:grid-cols-2 lg:items-center">
        <div>
          <span className="inline-flex items-center gap-2 rounded-full bg-ink-foreground/10 px-3 py-1.5 text-xs font-semibold uppercase tracking-wide">
            <Timer className="size-3.5" aria-hidden /> Average delivery 28 min
          </span>
          <h1 className="mt-5 font-display text-4xl font-extrabold leading-[1.05] text-balance-tight md:text-6xl">
            Hot food from Lagos&apos; best kitchens, at your door.
          </h1>
          <p className="mt-4 max-w-lg text-base text-ink-foreground/75 md:text-lg">
            Jollof that tastes like owambe, suya straight off the grill, shawarma at midnight. Order
            in seconds and watch your rider all the way in.
          </p>

          <form
            className="mt-8 flex flex-col gap-3 rounded-3xl bg-card p-3 text-foreground shadow-lift sm:flex-row"
            onSubmit={(event) => {
              event.preventDefault();
              navigate({ to: "/restaurants", search: { q: term || undefined } });
            }}
          >
            <label className="flex flex-1 items-center gap-2 rounded-2xl bg-muted px-4 py-3">
              <MapPin className="size-4 text-primary" aria-hidden />
              <span className="sr-only">Delivery address</span>
              <input
                defaultValue="Surulere, Lagos"
                className="w-full bg-transparent text-sm outline-none"
                aria-label="Delivery address"
              />
            </label>
            <label className="flex flex-1 items-center gap-2 rounded-2xl bg-muted px-4 py-3">
              <Search className="size-4 text-muted-foreground" aria-hidden />
              <span className="sr-only">Search dishes or restaurants</span>
              <input
                value={term}
                onChange={(event) => setTerm(event.target.value)}
                placeholder="What are you craving?"
                className="w-full bg-transparent text-sm outline-none"
              />
            </label>
            <button
              type="submit"
              className="rounded-2xl bg-primary px-6 py-3 text-sm font-bold text-primary-foreground transition-transform hover:-translate-y-0.5"
            >
              Find food
            </button>
          </form>

          <dl className="mt-8 flex gap-8 text-sm">
            {[
              ["1,200+", "kitchens"],
              ["30 min", "avg. delivery"],
              ["4.8★", "rider rating"],
            ].map(([value, label]) => (
              <div key={label}>
                <dt className="sr-only">{label}</dt>
                <dd className="font-display text-2xl font-bold">{value}</dd>
                <dd className="text-ink-foreground/60">{label}</dd>
              </div>
            ))}
          </dl>
        </div>
      </div>
    </section>
  );
}

function Categories() {
  const { data: categories } = useSuspenseQuery(categoriesQuery());
  const navigate = useNavigate();
  return (
    <section className="container-page py-12">
      <div className="flex items-end justify-between gap-4">
        <h2 className="font-display text-2xl font-bold md:text-3xl">Browse by craving</h2>
        <Link to="/categories" className="text-sm font-semibold text-primary hover:underline">
          All categories
        </Link>
      </div>
      <div className="hide-scrollbar mt-6 flex gap-3 overflow-x-auto pb-2">
        {categories.map((category) => (
          <CategoryChip
            key={category.id}
            category={category}
            onClick={() => navigate({ to: "/restaurants", search: { category: category.id } })}
          />
        ))}
      </div>
    </section>
  );
}

function FastestNearYou() {
  const { data: restaurants } = useSuspenseQuery(restaurantsQuery({ sort: "delivery-time" }));
  const { isFavorite, toggle } = useFavorites();
  return (
    <section className="container-page py-8">
      <div className="flex items-end justify-between gap-4">
        <div>
          <h2 className="font-display text-2xl font-bold md:text-3xl">Fastest near you</h2>
          <p className="mt-1 text-sm text-muted-foreground">
            Kitchens that get there before the food cools.
          </p>
        </div>
        <Link
          to="/restaurants"
          className="hidden items-center gap-1 text-sm font-semibold text-primary hover:underline sm:flex"
        >
          See all <ArrowRight className="size-4" aria-hidden />
        </Link>
      </div>
      <div className="mt-6 grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
        {restaurants.slice(0, 6).map((restaurant) => (
          <RestaurantCard
            key={restaurant.id}
            restaurant={restaurant}
            isFavorite={isFavorite(restaurant.id)}
            onToggleFavorite={toggle}
          />
        ))}
      </div>
    </section>
  );
}

function PopularDishes() {
  const { data: items } = useSuspenseQuery(popularItemsQuery());
  return (
    <section className="container-page py-8">
      <h2 className="font-display text-2xl font-bold md:text-3xl">Trending dishes today</h2>
      <div className="mt-6 grid gap-5 sm:grid-cols-2 lg:grid-cols-4">
        {items.map((item) => (
          <Link
            key={item.id}
            to="/restaurants/$id"
            params={{ id: item.restaurantId }}
            className="group overflow-hidden rounded-3xl border border-border bg-card shadow-soft transition-all hover:-translate-y-1 hover:shadow-lift"
          >
            <div className="aspect-square overflow-hidden">
              <img
                src={item.imageUrl}
                alt={item.name}
                loading="lazy"
                className="size-full object-cover transition-transform duration-500 group-hover:scale-105"
              />
            </div>
            <div className="p-4">
              <h3 className="font-display text-base font-bold leading-tight">{item.name}</h3>
              <p className="mt-1 text-sm text-muted-foreground">{formatNaira(item.price)}</p>
            </div>
          </Link>
        ))}
      </div>
    </section>
  );
}

const steps = [
  { Icon: Search, title: "Pick a kitchen", body: "Filter by craving, rating or delivery time." },
  {
    Icon: Utensils,
    title: "Build your order",
    body: "Add dishes, sides and drinks with notes for the chef.",
  },
  {
    Icon: ShieldCheck,
    title: "Pay securely",
    body: "Card, transfer or cash on delivery — your call.",
  },
  {
    Icon: Timer,
    title: "Track to your door",
    body: "Follow your rider live from kitchen to gate.",
  },
];

function HowItWorks() {
  return (
    <section className="container-page py-14">
      <h2 className="font-display text-2xl font-bold md:text-3xl">How FoodRush works</h2>
      <ol className="mt-8 grid gap-5 sm:grid-cols-2 lg:grid-cols-4">
        {steps.map(({ Icon, title, body }, index) => (
          <li key={title} className="rounded-3xl border border-border bg-card p-6 shadow-soft">
            <div className="grid size-11 place-items-center rounded-2xl bg-primary-soft text-primary">
              <Icon className="size-5" aria-hidden />
            </div>
            <h3 className="mt-4 font-display text-lg font-bold">
              {index + 1}. {title}
            </h3>
            <p className="mt-1 text-sm text-muted-foreground">{body}</p>
          </li>
        ))}
      </ol>
    </section>
  );
}
