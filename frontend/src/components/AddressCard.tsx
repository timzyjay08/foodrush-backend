import { MapPin, Pencil, Trash2 } from "lucide-react";
import type { Address } from "@/data/types";
import { cn } from "@/lib/utils";

type Props = {
  address: Address;
  /** Render as a radio-style option (checkout) instead of a static card. */
  selectable?: boolean;
  selected?: boolean;
  onSelect?: (id: string) => void;
  onEdit?: (id: string) => void;
  onDelete?: (id: string) => void;
};

export function AddressCard({
  address,
  selectable = false,
  selected = false,
  onSelect,
  onEdit,
  onDelete,
}: Props) {
  const body = (
    <>
      <div className="flex items-start gap-3">
        <span
          className={cn(
            "grid size-10 shrink-0 place-items-center rounded-2xl",
            selected ? "bg-primary text-primary-foreground" : "bg-primary-soft text-primary",
          )}
        >
          <MapPin className="size-5" aria-hidden />
        </span>
        <div className="min-w-0 flex-1">
          <div className="flex flex-wrap items-center gap-2">
            <h3 className="font-display text-base font-bold">{address.label}</h3>
            {address.isDefault && (
              <span className="rounded-full bg-accent-soft px-2 py-0.5 text-[11px] font-semibold text-accent">
                Default
              </span>
            )}
          </div>
          <p className="mt-1 text-sm text-muted-foreground">
            {address.street}, {address.area}, {address.city}
          </p>
          {address.instructions && (
            <p className="mt-1 text-xs text-muted-foreground">{address.instructions}</p>
          )}
        </div>
      </div>
      {(onEdit || onDelete) && (
        <div className="mt-4 flex items-center gap-2 border-t border-border pt-3">
          {onEdit && (
            <button
              type="button"
              onClick={() => onEdit(address.id)}
              className="inline-flex items-center gap-1.5 rounded-full px-3 py-2 text-xs font-semibold text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
            >
              <Pencil className="size-3.5" aria-hidden /> Edit
            </button>
          )}
          {onDelete && (
            <button
              type="button"
              onClick={() => onDelete(address.id)}
              className="inline-flex items-center gap-1.5 rounded-full px-3 py-2 text-xs font-semibold text-muted-foreground transition-colors hover:bg-destructive/10 hover:text-destructive"
            >
              <Trash2 className="size-3.5" aria-hidden /> Delete
            </button>
          )}
        </div>
      )}
    </>
  );

  const shell = cn(
    "w-full rounded-3xl border bg-card p-4 text-left shadow-soft transition-colors",
    selected ? "border-primary" : "border-border",
  );

  if (selectable) {
    return (
      <button
        type="button"
        onClick={() => onSelect?.(address.id)}
        aria-pressed={selected}
        className={cn(shell, "hover:border-primary")}
      >
        {body}
      </button>
    );
  }

  return <article className={shell}>{body}</article>;
}
