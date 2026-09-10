import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { Heart } from "lucide-react";
import { CustomerLayout } from "@/components/CustomerLayout";
import { EmptyState } from "@/components/EmptyState";
import { ErrorState } from "@/components/ErrorState";
import { RestaurantCard } from "@/components/RestaurantCard";
import { RestaurantCardSkeletonGrid } from "@/components/skeletons";
import { restaurantsQuery } from "@/hooks/queries";
import { useFavorites } from "@/hooks/useFavorites";
import { feedback } from "@/lib/feedback";

export const Route = createFileRoute("/favorites")({
  head: () => ({
    meta: [
      { title: "Saved kitchens — FoodRush" },
      {
        name: "description",
        content:
          "Your saved Lagos kitchens on FoodRush — reorder from the places you love in a couple of taps.",
      },
      { property: "og:title", content: "Saved kitchens — FoodRush" },
      {
        property: "og:description",
        content: "Keep your favourite Lagos restaurants one tap away with FoodRush favourites.",
      },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: FavoritesPage,
});

function FavoritesPage() {
  const favorites = useFavorites();
  const restaurants = useQuery(restaurantsQuery());

  const saved = (restaurants.data ?? []).filter((restaurant) =>
    favorites.ids.includes(restaurant.id),
  );

  return (
    <CustomerLayout
      title="Favourites"
      description="The kitchens you saved. Tap the heart on any restaurant to add or remove it."
    >
      {restaurants.isPending ? (
        <RestaurantCardSkeletonGrid count={3} />
      ) : restaurants.isError ? (
        <ErrorState
          title="We couldn't load your favourites"
          description="Your saved kitchens are still safe. Try again in a moment."
          onRetry={() => restaurants.refetch()}
        />
      ) : saved.length === 0 ? (
        <EmptyState
          icon={Heart}
          title="No favourites yet"
          description="Save the kitchens you order from most and they will show up here for faster reordering."
          action={
            <Link
              to="/restaurants"
              className="inline-flex items-center justify-center rounded-full bg-primary px-5 py-3 text-sm font-bold text-primary-foreground shadow-glow transition-transform hover:-translate-y-0.5"
            >
              Browse restaurants
            </Link>
          }
        />
      ) : (
        <>
          <p className="mb-4 text-sm text-muted-foreground">
            {saved.length} saved kitchen{saved.length === 1 ? "" : "s"}
          </p>
          <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
            {saved.map((restaurant) => (
              <RestaurantCard
                key={restaurant.id}
                restaurant={restaurant}
                isFavorite
                onToggleFavorite={(id) => {
                  favorites.toggle(id);
                  feedback.favoriteRemoved(restaurant.name);
                }}
              />
            ))}
          </div>
        </>
      )}
    </CustomerLayout>
  );
}
