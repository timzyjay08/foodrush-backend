import { Skeleton, SkeletonText } from "@/components/Skeleton";

/** Matches RestaurantCard: 16/10 image + title, tagline, meta row. */
export function RestaurantCardSkeleton() {
  return (
    <div className="overflow-hidden rounded-3xl border border-border bg-card shadow-soft">
      <Skeleton className="aspect-[16/10] w-full rounded-none" />
      <div className="space-y-3 p-4">
        <div className="flex items-start justify-between gap-3">
          <Skeleton className="h-5 w-2/3" />
          <Skeleton className="h-6 w-12" />
        </div>
        <Skeleton className="h-3 w-full" />
        <Skeleton className="h-3 w-1/2" />
      </div>
    </div>
  );
}

export function RestaurantCardSkeletonGrid({ count = 6 }: { count?: number }) {
  return (
    <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
      {Array.from({ length: count }).map((_, index) => (
        <RestaurantCardSkeleton key={index} />
      ))}
    </div>
  );
}

/** Matches FoodCard: text block left, square image right. */
export function FoodCardSkeleton() {
  return (
    <div className="flex gap-4 rounded-3xl border border-border bg-card p-3 shadow-soft">
      <div className="min-w-0 flex-1 space-y-3 py-1">
        <Skeleton className="h-4 w-1/2" />
        <Skeleton className="h-3 w-full" />
        <Skeleton className="h-4 w-20" />
      </div>
      <Skeleton className="size-24 shrink-0 rounded-2xl sm:size-28" />
    </div>
  );
}

export const MenuItemSkeleton = FoodCardSkeleton;

export function MenuItemSkeletonList({ count = 4 }: { count?: number }) {
  return (
    <div className="grid gap-4 lg:grid-cols-2">
      {Array.from({ length: count }).map((_, index) => (
        <FoodCardSkeleton key={index} />
      ))}
    </div>
  );
}

/** Matches CartItem: square image, title/price block, quantity row. */
export function CartItemSkeleton() {
  return (
    <div className="flex items-start gap-3 py-4 sm:gap-4">
      <Skeleton className="size-20 shrink-0 rounded-2xl" />
      <div className="min-w-0 flex-1 space-y-3">
        <div className="flex items-start justify-between gap-3">
          <Skeleton className="h-4 w-1/2" />
          <Skeleton className="h-4 w-16 shrink-0" />
        </div>
        <Skeleton className="h-3 w-24" />
        <Skeleton className="h-10 w-32 rounded-full" />
      </div>
    </div>
  );
}

export function CartItemSkeletonList({ count = 3 }: { count?: number }) {
  return (
    <div className="divide-y divide-border">
      {Array.from({ length: count }).map((_, index) => (
        <CartItemSkeleton key={index} />
      ))}
    </div>
  );
}

/** Order tracking / order detail screen: status card, timeline, receipt. */
export function OrderDetailSkeleton() {
  return (
    <div className="space-y-4">
      <div className="rounded-3xl border border-border bg-card p-5 shadow-soft">
        <div className="flex flex-wrap gap-2">
          <Skeleton className="h-7 w-32" />
          <Skeleton className="h-7 w-24" />
          <Skeleton className="h-7 w-20" />
        </div>
        <div className="mt-4 flex items-center gap-3">
          <Skeleton className="size-14 shrink-0 rounded-2xl" />
          <div className="min-w-0 flex-1 space-y-2">
            <Skeleton className="h-5 w-40" />
            <Skeleton className="h-3 w-28" />
          </div>
        </div>
      </div>
      <div className="rounded-3xl border border-border bg-card p-5 shadow-soft">
        <Skeleton className="h-4 w-36" />
        <div className="mt-5 space-y-5">
          {Array.from({ length: 5 }).map((_, index) => (
            <div key={index} className="flex gap-3.5">
              <Skeleton className="size-9 shrink-0" />
              <div className="min-w-0 flex-1 space-y-2 pt-1">
                <Skeleton className="h-3 w-1/3" />
                <Skeleton className="h-3 w-1/2" />
              </div>
            </div>
          ))}
        </div>
      </div>
      <div className="grid gap-4 sm:grid-cols-2">
        {Array.from({ length: 2 }).map((_, index) => (
          <div key={index} className="rounded-3xl border border-border bg-card p-5 shadow-soft">
            <Skeleton className="h-3 w-20" />
            <Skeleton className="mt-3 h-3 w-full" />
            <Skeleton className="mt-2 h-3 w-2/3" />
          </div>
        ))}
      </div>
    </div>
  );
}

export function OrderCardSkeleton() {
  return (
    <div className="rounded-3xl border border-border bg-card p-4 shadow-soft">
      <div className="flex items-center gap-3">
        <Skeleton className="size-14 shrink-0 rounded-2xl" />
        <div className="min-w-0 flex-1 space-y-2">
          <Skeleton className="h-4 w-1/2" />
          <Skeleton className="h-3 w-1/3" />
        </div>
        <Skeleton className="h-7 w-24 shrink-0" />
      </div>
      <div className="mt-4 grid grid-cols-2 gap-3 sm:grid-cols-4">
        {Array.from({ length: 4 }).map((_, index) => (
          <Skeleton key={index} className="h-3 w-full" />
        ))}
      </div>
    </div>
  );
}

export function OrderCardSkeletonList({ count = 3 }: { count?: number }) {
  return (
    <div className="space-y-4">
      {Array.from({ length: count }).map((_, index) => (
        <OrderCardSkeleton key={index} />
      ))}
    </div>
  );
}

/** Search + category rail skeleton used at the top of discovery pages. */
export function DiscoveryFiltersSkeleton() {
  return (
    <div className="space-y-4">
      <Skeleton className="h-12 w-full rounded-2xl" />
      <div className="flex gap-3 overflow-hidden">
        {Array.from({ length: 6 }).map((_, index) => (
          <Skeleton key={index} className="h-10 w-28 shrink-0 rounded-2xl" />
        ))}
      </div>
    </div>
  );
}

/** Restaurant details header: cover image + info block. */
export function RestaurantHeroSkeleton() {
  return (
    <div className="space-y-4">
      <Skeleton className="aspect-[16/9] w-full rounded-3xl md:aspect-[21/9]" />
      <div className="space-y-3">
        <Skeleton className="h-7 w-2/3 max-w-sm" />
        <Skeleton className="h-3 w-full max-w-md" />
        <div className="flex flex-wrap gap-3">
          {Array.from({ length: 3 }).map((_, index) => (
            <Skeleton key={index} className="h-8 w-24" />
          ))}
        </div>
      </div>
    </div>
  );
}

export function DashboardStatsSkeleton({ count = 4 }: { count?: number }) {
  return (
    <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
      {Array.from({ length: count }).map((_, index) => (
        <div key={index} className="rounded-3xl border border-border bg-card p-5 shadow-soft">
          <Skeleton className="h-3 w-24" />
          <Skeleton className="mt-4 h-7 w-28" />
          <Skeleton className="mt-3 h-3 w-16" />
        </div>
      ))}
    </div>
  );
}

export function ChartSkeleton({ className }: { className?: string }) {
  return (
    <div className={`rounded-3xl border border-border bg-card p-5 shadow-soft ${className ?? ""}`}>
      <Skeleton className="h-4 w-32" />
      <div className="mt-6 flex h-40 items-end gap-2 sm:h-56">
        {[45, 70, 35, 90, 60, 80, 50].map((height, index) => (
          <Skeleton key={index} className="flex-1 rounded-xl" style={{ height: `${height}%` }} />
        ))}
      </div>
    </div>
  );
}

export function TableRowSkeleton({ columns = 5 }: { columns?: number }) {
  return (
    <div
      className="grid items-center gap-3 border-b border-border px-4 py-4 last:border-0"
      style={{ gridTemplateColumns: `repeat(${columns}, minmax(0, 1fr))` }}
    >
      {Array.from({ length: columns }).map((_, index) => (
        <Skeleton key={index} className="h-3 w-full" />
      ))}
    </div>
  );
}

export function TableSkeleton({ rows = 6, columns = 5 }: { rows?: number; columns?: number }) {
  return (
    <div className="overflow-hidden rounded-3xl border border-border bg-card shadow-soft">
      {Array.from({ length: rows }).map((_, index) => (
        <TableRowSkeleton key={index} columns={columns} />
      ))}
    </div>
  );
}

export function ProfileSkeleton() {
  return (
    <div className="rounded-3xl border border-border bg-card p-5 shadow-soft sm:p-6">
      <div className="flex items-center gap-4">
        <Skeleton className="size-16 shrink-0 rounded-2xl" />
        <div className="min-w-0 flex-1 space-y-2">
          <Skeleton className="h-5 w-40" />
          <Skeleton className="h-3 w-28" />
        </div>
      </div>
      <div className="mt-6 grid gap-5 sm:grid-cols-2">
        {Array.from({ length: 4 }).map((_, index) => (
          <div key={index} className="space-y-2">
            <Skeleton className="h-3 w-20" />
            <Skeleton className="h-11 w-full rounded-2xl" />
          </div>
        ))}
      </div>
    </div>
  );
}

/** Generic full-page fallback: heading + content block. */
export function PageSkeleton() {
  return (
    <div className="container-page space-y-6 py-8">
      <Skeleton className="h-8 w-56 max-w-full" />
      <SkeletonText lines={2} className="max-w-lg" />
      <RestaurantCardSkeletonGrid count={3} />
    </div>
  );
}
