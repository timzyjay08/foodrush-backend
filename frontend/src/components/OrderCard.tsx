import { Link } from "@tanstack/react-router";
import { Clock, MapPin, ReceiptText } from "lucide-react";
import type { ReactNode } from "react";
import { Price } from "@/components/Price";
import { StatusBadge } from "@/components/StatusBadge";
import type { Order } from "@/data/types";
import { formatDateTime, PAYMENT_LABELS } from "@/utils/format";

type Props = {
  order: Order;
  /** Extra actions rendered in the footer (e.g. dashboard accept/reject). */
  actions?: ReactNode;
  /** Show the "View details" link to /orders/$id. */
  showDetailsLink?: boolean;
};

export function OrderCard({ order, actions, showDetailsLink = true }: Props) {
  const itemCount = order.items.reduce((sum, item) => sum + item.quantity, 0);
  const isFinished = order.status === "delivered" || order.status === "cancelled";

  return (
    <article className="rounded-3xl border border-border bg-card p-4 shadow-soft sm:p-5">
      <div className="grid grid-cols-[minmax(0,1fr)_auto] items-start gap-3 sm:flex sm:items-center sm:justify-between">
        <div className="flex min-w-0 items-center gap-3">
          {order.restaurantImage && (
            <img
              src={order.restaurantImage}
              alt=""
              loading="lazy"
              className="size-14 shrink-0 rounded-2xl object-cover"
            />
          )}
          <div className="min-w-0">
            <h3 className="truncate font-display text-base font-bold">{order.restaurantName}</h3>
            <p className="mt-0.5 truncate text-xs text-muted-foreground">
              {order.reference} · {formatDateTime(order.placedAt)}
            </p>
          </div>
        </div>
        <StatusBadge status={order.status} />
      </div>

      <dl className="mt-4 grid grid-cols-2 gap-3 text-xs text-muted-foreground sm:grid-cols-4">
        <div className="min-w-0">
          <dt className="flex items-center gap-1">
            <ReceiptText className="size-3.5 shrink-0" aria-hidden /> Items
          </dt>
          <dd className="mt-1 font-semibold text-foreground">{itemCount}</dd>
        </div>
        <div className="min-w-0">
          <dt className="flex items-center gap-1">
            <Clock className="size-3.5 shrink-0" aria-hidden /> {isFinished ? "Status" : "ETA"}
          </dt>
          <dd className="mt-1 font-semibold text-foreground">
            {isFinished ? "Completed" : `${order.etaMinutes} min`}
          </dd>
        </div>
        <div className="min-w-0">
          <dt>Payment</dt>
          <dd className="mt-1 font-semibold text-foreground">
            {order.paymentMethod ? PAYMENT_LABELS[order.paymentMethod] : "—"}
          </dd>
        </div>
        <div className="min-w-0">
          <dt>Total</dt>
          <dd className="mt-1">
            <Price amount={order.total} size="sm" className="text-foreground" />
          </dd>
        </div>
      </dl>

      <p className="mt-3 flex items-start gap-1.5 text-xs text-muted-foreground">
        <MapPin className="mt-0.5 size-3.5 shrink-0" aria-hidden />
        <span className="min-w-0">{order.address}</span>
      </p>

      {(showDetailsLink || actions) && (
        <div className="mt-4 flex flex-wrap items-center gap-3 border-t border-border pt-4">
          {showDetailsLink && (
            <Link
              to="/orders/$id"
              params={{ id: order.id }}
              className="rounded-full border border-border px-4 py-2 text-xs font-semibold transition-colors hover:bg-muted"
            >
              View details
            </Link>
          )}
          {actions}
        </div>
      )}
    </article>
  );
}
