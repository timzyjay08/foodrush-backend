import { Star } from "lucide-react";
import { cn } from "@/lib/utils";

type Props = {
  value: number;
  reviewCount?: number;
  /** "chip" = soft pill (cards), "inline" = plain text (headers/lists). */
  variant?: "chip" | "inline";
  className?: string;
};

export function Rating({ value, reviewCount, variant = "chip", className }: Props) {
  const label = `Rated ${value.toFixed(1)} out of 5${
    reviewCount ? ` from ${reviewCount} reviews` : ""
  }`;

  return (
    <span
      aria-label={label}
      className={cn(
        "inline-flex items-center gap-1 text-sm font-semibold",
        variant === "chip"
          ? "rounded-full bg-accent-soft px-2.5 py-1 text-accent"
          : "text-foreground",
        className,
      )}
    >
      <Star className="size-3.5 fill-current" aria-hidden />
      {value.toFixed(1)}
      {reviewCount !== undefined && (
        <span className="font-medium text-muted-foreground">({reviewCount})</span>
      )}
    </span>
  );
}
