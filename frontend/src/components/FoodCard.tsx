import { Flame, Plus } from "lucide-react";
import type { MenuItem } from "@/data/types";
import { formatNaira } from "@/utils/format";

export function FoodCard({
  item,
  onSelect,
}: {
  item: MenuItem;
  onSelect: (item: MenuItem) => void;
}) {
  return (
    <article className="flex gap-4 rounded-3xl border border-border bg-card p-3 shadow-soft transition-all hover:-translate-y-0.5 hover:shadow-lift">
      <div className="min-w-0 flex-1 py-1">
        <div className="flex items-center gap-2">
          <h3 className="font-display text-base font-bold leading-tight">{item.name}</h3>
          {item.spicy && <Flame className="size-4 text-primary" aria-label="Spicy" />}
        </div>
        <p className="mt-1 line-clamp-2 text-sm text-muted-foreground">{item.description}</p>
        <div className="mt-3 flex items-center gap-2">
          <span className="font-semibold">{formatNaira(item.price)}</span>
          {item.popular && (
            <span className="rounded-full bg-primary-soft px-2 py-0.5 text-[11px] font-semibold text-primary">
              Popular
            </span>
          )}
        </div>
      </div>
      <div className="relative size-24 shrink-0 overflow-hidden rounded-2xl sm:size-28">
        <img
          src={item.imageUrl}
          alt={item.name}
          loading="lazy"
          className="size-full object-cover"
        />
        <button
          type="button"
          onClick={() => onSelect(item)}
          aria-label={`Add ${item.name} to cart`}
          className="absolute bottom-1.5 right-1.5 grid size-8 place-items-center rounded-full bg-primary text-primary-foreground shadow-glow transition-transform hover:scale-110"
        >
          <Plus className="size-4" aria-hidden />
        </button>
      </div>
    </article>
  );
}
