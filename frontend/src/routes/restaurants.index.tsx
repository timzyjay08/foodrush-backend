import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { Search, SlidersHorizontal, X } from "lucide-react";
import { AppShell } from "@/components/AppShell";
import { EmptyState } from "@/components/EmptyState";
import { ErrorState } from "@/components/ErrorState";
import { RestaurantCardSkeletonGrid } from "@/components/skeletons";

import { CategoryChip } from "@/components/CategoryChip";
import { RestaurantCard } from "@/components/RestaurantCard";
import { categoriesQuery, restaurantsQuery } from "@/hooks/queries";
import { useFavorites } from "@/hooks/useFavorites";

type DiscoverySearch = { q?: string; category?: string; sort?: string };

const SORTS = [
  { value: "nearest", label: "Nearest" },
  { value: "rating", label: "Top rated" },
  { value: "delivery-time", label: "Fastest delivery" },
  { value: "delivery-fee", label: "Cheapest delivery" },
] as const;

export const Route = createFileRoute("/restaurants/")({
  validateSearch: (search: Record<string, unknown>): DiscoverySearch => {
    const result: DiscoverySearch = { sort: "nearest" };
    if (typeof search["q"] === "string" && search["q"]) result.q = search["q"];
    if (typeof search["category"] === "string" && search["category"])
      result.category = search["category"];
    if (typeof search["sort"] === "string" && search["sort"]) result.sort = search["sort"];
    return result;
  },
  head: () => ({
    meta: [
      { title: "Browse Lagos restaurants — FoodRush" },
      {
        name: "description",
        content:
          "Search and filter Lagos kitchens by cuisine, rating, delivery time and delivery fee, then order in a few taps.",
      },
      { property: "og:title", content: "Browse Lagos restaurants — FoodRush" },
      {
        property: "og:description",
        content: "Find jollof, suya, shawarma and more from kitchens delivering near you.",
      },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: DiscoveryPage,
});

function DiscoveryPage() {
  const { q, category, sort } = Route.useSearch();
  const navigate = useNavigate({ from: Route.fullPath });
  const favorites = useFavorites();

  const categories = useQuery(categoriesQuery());
  const restaurants = useQuery(
    restaurantsQuery({ ...(q ? { search: q } : {}), ...(category ? { category } : {}), sort }),
  );

  const update = (next: Partial<DiscoverySearch>) =>
    navigate({ search: (prev) => ({ ...prev, ...next }) });

  const activeFilters = Boolean(q || category || (sort && sort !== "nearest"));

  // Open kitchens first — closed ones stay browsable at the end of the grid.
  const ordered = useMemo(() => {
    const list = restaurants.data ?? [];
    return [...list].sort((a, b) => Number(b.isOpen) - Number(a.isOpen));
  }, [restaurants.data]);
  const openCount = ordered.filter((restaurant) => restaurant.isOpen).length;
  const closedCount = ordered.length - openCount;

  return (
    <AppShell>
      <section className="border-b border-border bg-card/60">
        <div className="container-page py-8 md:py-12">
          <h1 className="font-display text-3xl font-extrabold tracking-tight md:text-4xl">
            Restaurants near you
          </h1>
          <p className="mt-2 max-w-xl text-muted-foreground">
            {restaurants.data
              ? `${restaurants.data.length} kitchen${restaurants.data.length === 1 ? "" : "s"} delivering in Lagos right now.`
              : "Loading kitchens delivering in Lagos…"}
          </p>

          <form
            className="mt-6 flex flex-col gap-3 sm:flex-row"
            onSubmit={(event) => {
              event.preventDefault();
              const value = new FormData(event.currentTarget).get("q");
              update({ q: typeof value === "string" && value.trim() ? value.trim() : undefined });
            }}
          >
            <div className="flex flex-1 items-center gap-2 rounded-full border border-border bg-card px-4 py-3 shadow-soft focus-within:border-primary">
              <Search className="size-4 text-muted-foreground" aria-hidden />
              <label className="sr-only" htmlFor="discovery-search">
                Search restaurants
              </label>
              <input
                id="discovery-search"
                name="q"
                defaultValue={q ?? ""}
                key={q ?? "empty"}
                placeholder="Search a kitchen, dish or area"
                className="w-full bg-transparent text-sm outline-none placeholder:text-muted-foreground"
              />
            </div>
            <div className="flex items-center gap-2 rounded-full border border-border bg-card px-4 py-3 shadow-soft">
              <SlidersHorizontal className="size-4 text-muted-foreground" aria-hidden />
              <label className="sr-only" htmlFor="discovery-sort">
                Sort restaurants
              </label>
              <select
                id="discovery-sort"
                value={sort}
                onChange={(event) => update({ sort: event.target.value })}
                className="bg-transparent text-sm font-semibold outline-none"
              >
                {SORTS.map((option) => (
                  <option key={option.value} value={option.value}>
                    {option.label}
                  </option>
                ))}
              </select>
            </div>
            <button
              type="submit"
              className="rounded-full bg-primary px-6 py-3 text-sm font-semibold text-primary-foreground shadow-glow transition-transform hover:-translate-y-0.5"
            >
              Search
            </button>
          </form>

          <div className="hide-scrollbar mt-5 flex gap-2 overflow-x-auto pb-1">
            <button
              type="button"
              onClick={() => update({ category: undefined })}
              aria-pressed={!category}
              className={`shrink-0 rounded-full border px-4 py-2.5 text-sm font-semibold transition-all ${
                !category
                  ? "border-primary bg-primary text-primary-foreground shadow-glow"
                  : "border-border bg-card hover:-translate-y-0.5 hover:shadow-soft"
              }`}
            >
              All
            </button>
            {(categories.data ?? []).map((item) => (
              <CategoryChip
                key={item.id}
                category={item}
                active={category === item.id}
                onClick={() => update({ category: category === item.id ? undefined : item.id })}
              />
            ))}
          </div>

          {activeFilters && (
            <button
              type="button"
              onClick={() => navigate({ search: { sort: "nearest" } })}
              className="mt-4 inline-flex items-center gap-1.5 rounded-full bg-muted px-3 py-1.5 text-xs font-semibold text-muted-foreground hover:text-foreground"
            >
              <X className="size-3.5" aria-hidden /> Clear filters
            </button>
          )}
        </div>
      </section>

      <section className="container-page py-8 md:py-12">
        {restaurants.isPending ? (
          <RestaurantCardSkeletonGrid count={6} />
        ) : restaurants.isError ? (
          <ErrorState
            title="We couldn't load restaurants"
            description="Your connection dropped while fetching kitchens near you. Try again in a moment."
            onRetry={() => void restaurants.refetch()}
          />
        ) : ordered.length > 0 ? (
          <>
            <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
              {ordered.map((restaurant) => (
                <RestaurantCard
                  key={restaurant.id}
                  restaurant={restaurant}
                  isFavorite={favorites.isFavorite(restaurant.id)}
                  onToggleFavorite={favorites.toggle}
                />
              ))}
            </div>
            {closedCount > 0 && (
              <p className="mt-6 text-sm text-muted-foreground">
                {closedCount} kitchen{closedCount === 1 ? " is" : "s are"} currently closed — you
                can still browse their menu and order when they reopen.
              </p>
            )}
          </>
        ) : (
          <EmptyState
            emoji="🔎"
            title="No kitchens match that search"
            description="Try a different dish, area or clear the filters to see everything delivering near you."
            action={
              <button
                type="button"
                onClick={() => navigate({ search: { sort: "nearest" } })}
                className="rounded-full bg-primary px-5 py-2.5 text-sm font-semibold text-primary-foreground shadow-glow"
              >
                Reset filters
              </button>
            }
          />
        )}
      </section>
    </AppShell>
  );
}
