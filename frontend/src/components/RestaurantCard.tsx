import { Link } from "@tanstack/react-router";
import { Bike, Clock, Heart, Star } from "lucide-react";
import type { Restaurant } from "@/data/types";
import { formatDeliveryWindow, formatNaira } from "@/utils/format";

type Props = {
  restaurant: Restaurant;
  isFavorite?: boolean;
  onToggleFavorite?: (id: string) => void;
};

export function RestaurantCard({ restaurant, isFavorite, onToggleFavorite }: Props) {
  return (
    <article className="group relative overflow-hidden rounded-3xl border border-border bg-card shadow-soft transition-all hover:-translate-y-1 hover:shadow-lift">
      <div className="relative aspect-[16/10] overflow-hidden">
        <img
          src={restaurant.imageUrl}
          alt={`${restaurant.name} food`}
          loading="lazy"
          className="size-full object-cover transition-transform duration-500 group-hover:scale-105"
        />
        {restaurant.promo && (
          <span className="absolute left-3 top-3 rounded-full bg-primary px-3 py-1 text-xs font-semibold text-primary-foreground">
            {restaurant.promo}
          </span>
        )}
        {!restaurant.isOpen && (
          <span className="absolute inset-0 grid place-items-center bg-ink/60 text-sm font-semibold text-ink-foreground">
            Currently closed
          </span>
        )}
        {onToggleFavorite && (
          <button
            type="button"
            onClick={() => onToggleFavorite(restaurant.id)}
            aria-label={
              isFavorite ? `Remove ${restaurant.name} from favorites` : `Save ${restaurant.name}`
            }
            aria-pressed={isFavorite}
            className="absolute right-3 top-3 grid size-9 place-items-center rounded-full bg-card/90 text-foreground shadow-soft transition-colors hover:text-primary"
          >
            <Heart
              className={`size-4 ${isFavorite ? "fill-primary text-primary" : ""}`}
              aria-hidden
            />
          </button>
        )}
      </div>

      <div className="space-y-3 p-4">
        <div className="flex items-start justify-between gap-3">
          <div>
            <h3 className="font-display text-lg font-bold leading-tight">
              <Link
                to="/restaurants/$id"
                params={{ id: restaurant.id }}
                className="hover:text-primary"
              >
                <span className="absolute inset-0" aria-hidden />
                {restaurant.name}
              </Link>
            </h3>
            <p className="mt-1 text-sm text-muted-foreground">{restaurant.tagline}</p>
          </div>
          <span className="flex shrink-0 items-center gap-1 rounded-full bg-accent-soft px-2.5 py-1 text-sm font-semibold text-accent">
            <Star className="size-3.5 fill-current" aria-hidden />
            {restaurant.rating.toFixed(1)}
          </span>
        </div>
        <dl className="flex flex-wrap items-center gap-x-4 gap-y-1 text-xs text-muted-foreground">
          <div className="flex items-center gap-1">
            <Clock className="size-3.5" aria-hidden />
            <dt className="sr-only">Delivery time</dt>
            <dd>{formatDeliveryWindow(restaurant.deliveryMinutes)}</dd>
          </div>
          <div className="flex items-center gap-1">
            <Bike className="size-3.5" aria-hidden />
            <dt className="sr-only">Delivery fee</dt>
            <dd>{formatNaira(restaurant.deliveryFee)}</dd>
          </div>
          <div>
            <dt className="sr-only">Area</dt>
            <dd>{restaurant.area}</dd>
          </div>
        </dl>
      </div>
    </article>
  );
}
