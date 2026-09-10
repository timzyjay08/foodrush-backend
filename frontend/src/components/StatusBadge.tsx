import { CheckCircle2, ChefHat, Bike, Clock, XCircle } from "lucide-react";
import type { OrderStatus } from "@/data/types";
import { ORDER_STATUS_META } from "@/utils/format";

const tones: Record<string, string> = {
  neutral: "bg-muted text-muted-foreground",
  info: "bg-primary-soft text-primary",
  success: "bg-accent-soft text-accent",
  warning: "bg-warning/20 text-warning-foreground",
  danger: "bg-destructive/12 text-destructive",
};

const icons: Record<OrderStatus, typeof Clock> = {
  pending: Clock,
  confirmed: CheckCircle2,
  preparing: ChefHat,
  on_the_way: Bike,
  delivered: CheckCircle2,
  cancelled: XCircle,
};

export function StatusBadge({ status }: { status: OrderStatus }) {
  const meta = ORDER_STATUS_META[status];
  const Icon = icons[status];
  return (
    <span
      className={`inline-flex items-center gap-1.5 rounded-full px-3 py-1 text-xs font-semibold ${tones[meta.tone]}`}
    >
      <Icon className="size-3.5" aria-hidden />
      {meta.label}
    </span>
  );
}
