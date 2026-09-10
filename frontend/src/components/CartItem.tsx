import { Trash2 } from "lucide-react";
import { Price } from "@/components/Price";
import { QuantitySelector } from "@/components/QuantitySelector";
import type { CartLine } from "@/data/types";

type Props = {
  line: CartLine;
  onQuantityChange: (quantity: number) => void;
  onRemove?: () => void;
  /** Compact variant for checkout / summary panels. */
  compact?: boolean;
};

export function CartItem({ line, onQuantityChange, onRemove, compact = false }: Props) {
  return (
    <li className="flex items-start gap-3 py-4 sm:gap-4">
      <img
        src={line.imageUrl}
        alt={line.name}
        loading="lazy"
        className={`shrink-0 rounded-2xl object-cover ${compact ? "size-14" : "size-20"}`}
      />
      <div className="min-w-0 flex-1">
        <div className="flex items-start justify-between gap-3">
          <div className="min-w-0">
            <h3 className="truncate font-display text-base font-bold">{line.name}</h3>
            <Price amount={line.price} size="sm" className="mt-1 text-muted-foreground" />
            {line.note && (
              <p className="mt-1 line-clamp-2 text-xs text-muted-foreground">Note: {line.note}</p>
            )}
          </div>
          <Price amount={line.price * line.quantity} className="shrink-0" />
        </div>
        <div className="mt-3 flex items-center gap-3">
          <QuantitySelector
            value={line.quantity}
            onChange={onQuantityChange}
            label={line.name}
            min={1}
          />
          {onRemove && (
            <button
              type="button"
              onClick={onRemove}
              aria-label={`Remove ${line.name} from cart`}
              className="inline-flex items-center gap-1.5 rounded-full px-3 py-2 text-xs font-semibold text-muted-foreground transition-colors hover:bg-destructive/10 hover:text-destructive"
            >
              <Trash2 className="size-4" aria-hidden />
              Remove
            </button>
          )}
        </div>
      </div>
    </li>
  );
}
