import type { CSSProperties } from "react";
import { cn } from "@/lib/utils";

/**
 * Base skeleton block. Every FoodRush loading state is composed from this so
 * shimmer, radius and color stay consistent across customer and dashboard UI.
 */
export function Skeleton({ className, style }: { className?: string; style?: CSSProperties }) {
  return (
    <div
      aria-hidden
      style={style}
      className={cn("animate-pulse rounded-full bg-muted", className)}
    />
  );
}

export function SkeletonText({ lines = 3, className }: { lines?: number; className?: string }) {
  return (
    <div className={cn("space-y-2", className)}>
      {Array.from({ length: lines }).map((_, index) => (
        <Skeleton key={index} className={cn("h-3", index === lines - 1 ? "w-1/2" : "w-full")} />
      ))}
    </div>
  );
}
