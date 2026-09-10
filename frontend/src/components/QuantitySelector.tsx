import { Minus, Plus } from "lucide-react";

type Props = {
  value: number;
  onChange: (value: number) => void;
  min?: number;
  label?: string;
};

export function QuantitySelector({ value, onChange, min = 1, label = "Quantity" }: Props) {
  return (
    <div className="inline-flex items-center gap-1 rounded-full border border-border bg-card p-1">
      <button
        type="button"
        onClick={() => onChange(Math.max(min, value - 1))}
        aria-label={`Decrease ${label.toLowerCase()}`}
        className="grid size-8 place-items-center rounded-full text-foreground transition-colors hover:bg-muted disabled:opacity-40"
        disabled={value <= min}
      >
        <Minus className="size-4" aria-hidden />
      </button>
      <span aria-live="polite" className="min-w-6 text-center text-sm font-semibold">
        {value}
      </span>
      <button
        type="button"
        onClick={() => onChange(value + 1)}
        aria-label={`Increase ${label.toLowerCase()}`}
        className="grid size-8 place-items-center rounded-full bg-primary text-primary-foreground transition-transform hover:scale-105"
      >
        <Plus className="size-4" aria-hidden />
      </button>
    </div>
  );
}
