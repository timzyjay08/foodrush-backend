import type { Category } from "@/data/types";

export function CategoryChip({
  category,
  active,
  onClick,
}: {
  category: Category;
  active?: boolean;
  onClick?: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      aria-pressed={active}
      className={`flex shrink-0 items-center gap-2 rounded-full border px-4 py-2.5 text-sm font-semibold transition-all ${
        active
          ? "border-primary bg-primary text-primary-foreground shadow-glow"
          : "border-border bg-card text-foreground hover:-translate-y-0.5 hover:shadow-soft"
      }`}
    >
      <span aria-hidden className="text-base">
        {category.emoji}
      </span>
      {category.name}
    </button>
  );
}
