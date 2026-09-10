import { cn } from "@/lib/utils";
import { formatNaira } from "@/utils/format";

type Props = {
  amount: number;
  /** Original price for discounts — rendered struck through. */
  compareAt?: number;
  size?: "sm" | "md" | "lg";
  className?: string;
};

const sizes = {
  sm: "text-sm",
  md: "text-base",
  lg: "font-display text-xl",
} as const;

export function Price({ amount, compareAt, size = "md", className }: Props) {
  return (
    <span className={cn("inline-flex items-baseline gap-2 font-semibold", sizes[size], className)}>
      {formatNaira(amount)}
      {compareAt !== undefined && compareAt > amount && (
        <span className="text-xs font-medium text-muted-foreground line-through">
          {formatNaira(compareAt)}
        </span>
      )}
    </span>
  );
}
