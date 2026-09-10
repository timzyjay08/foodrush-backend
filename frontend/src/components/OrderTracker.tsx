import { Bike, Check, ChefHat, CircleDot, PackageCheck, Receipt, XCircle } from "lucide-react";
import type { OrderStatus } from "@/data/types";
import { ORDER_STATUS_META } from "@/utils/format";
import { cn } from "@/lib/utils";

/**
 * Visual delivery timeline built on the existing frontend OrderStatus model.
 * Statuses are intentionally NOT expanded here — the richer backend lifecycle
 * will be mapped onto these stages during backend integration.
 */

const STAGES: {
  status: Exclude<OrderStatus, "cancelled">;
  icon: typeof Receipt;
  hint: string;
}[] = [
  { status: "pending", icon: Receipt, hint: "We sent your order to the kitchen." },
  { status: "confirmed", icon: Check, hint: "The kitchen accepted your order." },
  { status: "preparing", icon: ChefHat, hint: "Your food is being cooked fresh." },
  { status: "on_the_way", icon: Bike, hint: "A rider is bringing it to you." },
  { status: "delivered", icon: PackageCheck, hint: "Enjoy your meal!" },
];

export function OrderTracker({
  status,
  etaMinutes,
  className,
}: {
  status: OrderStatus;
  etaMinutes?: number;
  className?: string;
}) {
  const cancelled = status === "cancelled";
  const currentStep = ORDER_STATUS_META[status].step;

  return (
    <div className={cn("rounded-3xl border border-border bg-card p-5 shadow-soft", className)}>
      <div className="flex flex-wrap items-center justify-between gap-2">
        <h2 className="font-display text-lg font-bold">
          {cancelled ? "Order cancelled" : "Delivery progress"}
        </h2>
        {!cancelled && status !== "delivered" && etaMinutes !== undefined && (
          <span className="rounded-full bg-primary-soft px-3 py-1 text-xs font-semibold text-primary">
            Arriving in ~{etaMinutes} min
          </span>
        )}
      </div>

      {cancelled ? (
        <div className="mt-4 flex items-start gap-3 rounded-2xl bg-destructive/8 p-4">
          <span className="grid size-9 shrink-0 place-items-center rounded-full bg-destructive/12 text-destructive">
            <XCircle className="size-5" aria-hidden />
          </span>
          <p className="text-sm text-muted-foreground">
            This order was cancelled, so it is no longer being prepared or delivered. Nothing more
            will be charged.
          </p>
        </div>
      ) : (
        <ol className="mt-5 space-y-0">
          {STAGES.map((stage, index) => {
            const step = ORDER_STATUS_META[stage.status].step;
            const isDone = step < currentStep;
            const isCurrent = step === currentStep;
            const isLast = index === STAGES.length - 1;
            const Icon = isDone ? Check : isCurrent ? CircleDot : stage.icon;

            return (
              <li key={stage.status} className="flex gap-3.5">
                <div className="flex flex-col items-center">
                  <span
                    aria-hidden
                    className={cn(
                      "grid size-9 shrink-0 place-items-center rounded-full border-2 transition-colors",
                      isDone && "border-accent bg-accent text-accent-foreground",
                      isCurrent && "border-primary bg-primary text-primary-foreground shadow-glow",
                      !isDone && !isCurrent && "border-border bg-muted text-muted-foreground",
                    )}
                  >
                    <Icon className={cn("size-4", isCurrent && "animate-pulse")} />
                  </span>
                  {!isLast && (
                    <span
                      aria-hidden
                      className={cn(
                        "w-0.5 flex-1 rounded-full",
                        isDone ? "bg-accent" : "bg-border",
                      )}
                    />
                  )}
                </div>
                <div className={cn("min-w-0 flex-1", isLast ? "pb-0" : "pb-6")}>
                  <p
                    className={cn(
                      "text-sm font-semibold",
                      isCurrent
                        ? "text-foreground"
                        : isDone
                          ? "text-foreground"
                          : "text-muted-foreground",
                    )}
                  >
                    {ORDER_STATUS_META[stage.status].label}
                    {isCurrent && (
                      <span className="ml-2 rounded-full bg-primary-soft px-2 py-0.5 text-[11px] font-semibold text-primary">
                        Now
                      </span>
                    )}
                  </p>
                  <p className="mt-0.5 text-xs text-muted-foreground">{stage.hint}</p>
                </div>
              </li>
            );
          })}
        </ol>
      )}
    </div>
  );
}
