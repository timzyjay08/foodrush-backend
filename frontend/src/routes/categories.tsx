import { createFileRoute, Link } from "@tanstack/react-router";
import { ArrowRight, UtensilsCrossed } from "lucide-react";
import { AppShell } from "@/components/AppShell";
import { CategoryChip } from "@/components/CategoryChip";
import { EmptyState } from "@/components/EmptyState";
import { categoriesQuery } from "@/hooks/queries";
import { useQuery } from "@tanstack/react-query";
import type { Category } from "@/data/types";

export const Route = createFileRoute("/categories")({
  head: () => ({
    meta: [
      { title: "Categories — FoodRush" },
      { name: "description", content: "Categories on FoodRush, Lagos food delivery." },
      { property: "og:title", content: "Categories — FoodRush" },
      { property: "og:description", content: "Categories on FoodRush, Lagos food delivery." },
    ],
  }),
  component: CategoriesPage,
});

const categoryEmoji: Record<string, string> = {
  jollof: "🍚",
  grills: "🍖",
  swallow: "🍲",
  shawarma: "🌯",
  drinks: "🥤",
  breakfast: "🍳",
};

function CategoriesPage() {
  const categories = useQuery(categoriesQuery());
  const items = (categories.data ?? []).map((category) => ({
    ...category,
    emoji: categoryEmoji[category.name.toLowerCase()] ?? "🍽️",
  })) as Category[];

  return (
    <AppShell>
      <main className="container-page py-10 md:py-16">
        <section className="relative overflow-hidden rounded-[2rem] bg-ink px-6 py-10 text-ink-foreground shadow-lift md:px-10 md:py-14">
          <div className="relative z-10 max-w-2xl">
            <p className="text-xs font-bold uppercase tracking-[0.2em] text-primary">
              Find your next favorite
            </p>
            <h1 className="mt-3 font-display text-4xl font-extrabold tracking-tight md:text-6xl">
              What are you hungry for?
            </h1>
            <p className="mt-4 max-w-xl text-sm leading-6 text-ink-foreground/70 md:text-base">
              Browse by cuisine, craving or occasion. Every category leads you to kitchens ready to
              deliver across Lagos.
            </p>
          </div>
          <UtensilsCrossed
            className="absolute -bottom-8 -right-5 size-44 rotate-12 text-primary/15 md:size-64"
            aria-hidden
          />
        </section>

        <section className="mt-10" aria-labelledby="category-heading">
          <div className="flex items-end justify-between gap-4">
            <div>
              <p className="text-sm font-semibold text-primary">Explore the menu</p>
              <h2 id="category-heading" className="mt-1 font-display text-2xl font-bold">
                Popular categories
              </h2>
            </div>
            <Link
              to="/restaurants"
              className="hidden items-center gap-1 text-sm font-semibold text-primary sm:inline-flex"
            >
              See all restaurants <ArrowRight className="size-4" aria-hidden />
            </Link>
          </div>

          {categories.isLoading ? (
            <div className="mt-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
              {Array.from({ length: 8 }, (_, index) => (
                <div key={index} className="h-28 animate-pulse rounded-3xl bg-muted" />
              ))}
            </div>
          ) : items.length === 0 ? (
            <div className="mt-6">
              <EmptyState
                emoji="🍽️"
                title="Categories are on the way"
                description="Check back soon for the latest FoodRush kitchens."
              />
            </div>
          ) : (
            <div className="mt-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
              {items.map((category) => (
                <Link
                  key={category.id}
                  to="/restaurants"
                  search={{ category: category.name }}
                  className="group rounded-3xl border border-border bg-card p-5 shadow-soft transition-all hover:-translate-y-1 hover:border-primary/50 hover:shadow-lift"
                >
                  <CategoryChip category={category} />
                  <div className="mt-5 flex items-center justify-between text-xs font-semibold text-muted-foreground">
                    <span>Browse kitchens</span>
                    <ArrowRight
                      className="size-4 text-primary transition-transform group-hover:translate-x-1"
                      aria-hidden
                    />
                  </div>
                </Link>
              ))}
            </div>
          )}
        </section>
      </main>
    </AppShell>
  );
}
