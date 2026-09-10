import type { ComponentType, ReactNode } from "react";

export function EmptyState({
  emoji = "🍽️",
  icon: Icon,
  title,
  description,
  action,
}: {
  /** Existing API — kept so current screens keep working. */
  emoji?: string;
  /** Optional Lucide icon; when provided it replaces the emoji. */
  icon?: ComponentType<{ className?: string }>;
  title: string;
  description?: string;
  action?: ReactNode;
}) {
  return (
    <div className="rounded-3xl border border-dashed border-border bg-card/60 px-6 py-16 text-center">
      <div className="mx-auto grid size-16 place-items-center rounded-2xl bg-primary-soft text-3xl text-primary">
        {Icon ? <Icon className="size-7" /> : emoji}
      </div>
      <h2 className="mt-5 font-display text-xl font-bold">{title}</h2>
      {description && (
        <p className="mx-auto mt-2 max-w-sm text-sm text-muted-foreground">{description}</p>
      )}
      {action && <div className="mt-6 flex justify-center">{action}</div>}
    </div>
  );
}

export function CardSkeletonGrid({ count = 6 }: { count?: number }) {
  return (
    <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
      {Array.from({ length: count }).map((_, index) => (
        <div key={index} className="overflow-hidden rounded-3xl border border-border bg-card">
          <div className="aspect-[16/10] animate-pulse bg-muted" />
          <div className="space-y-3 p-4">
            <div className="h-4 w-2/3 animate-pulse rounded-full bg-muted" />
            <div className="h-3 w-full animate-pulse rounded-full bg-muted" />
            <div className="h-3 w-1/3 animate-pulse rounded-full bg-muted" />
          </div>
        </div>
      ))}
    </div>
  );
}
