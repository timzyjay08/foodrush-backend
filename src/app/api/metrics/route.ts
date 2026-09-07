import { users, restaurants, deliveryRiders, orders, payments } from "@/db/schema";
import { count, eq } from "drizzle-orm";

export const dynamic = "force-dynamic";

function toMetricValue(value: number | null | undefined): number {
  if (typeof value !== "number" || Number.isNaN(value) || !Number.isFinite(value)) {
    return 0;
  }

  return Math.max(0, value);
}

export function buildPrometheusMetrics({
  usersTotal,
  restaurantsTotal,
  ridersTotal,
  ordersTotal,
  ordersDelivered,
  ordersCancelled,
  ordersRefunded,
  paymentsFailed,
}: {
  usersTotal?: number | null;
  restaurantsTotal?: number | null;
  ridersTotal?: number | null;
  ordersTotal?: number | null;
  ordersDelivered?: number | null;
  ordersCancelled?: number | null;
  ordersRefunded?: number | null;
  paymentsFailed?: number | null;
}) {
  const safeUsersTotal = toMetricValue(usersTotal);
  const safeRestaurantsTotal = toMetricValue(restaurantsTotal);
  const safeRidersTotal = toMetricValue(ridersTotal);
  const safeOrdersTotal = toMetricValue(ordersTotal);
  const safeOrdersDelivered = toMetricValue(ordersDelivered);
  const safeOrdersCancelled = toMetricValue(ordersCancelled);
  const safeOrdersRefunded = toMetricValue(ordersRefunded);
  const safePaymentsFailed = toMetricValue(paymentsFailed);

  const active = Math.max(
    0,
    safeOrdersTotal - safeOrdersDelivered - safeOrdersCancelled - safeOrdersRefunded,
  );

  return [
    "# HELP foodrush_orders_total Total orders placed.",
    "# TYPE foodrush_orders_total counter",
    `foodrush_orders_total ${safeOrdersTotal}`,
    "# HELP foodrush_orders_delivered_total Orders delivered.",
    "# TYPE foodrush_orders_delivered_total counter",
    `foodrush_orders_delivered_total ${safeOrdersDelivered}`,
    "# HELP foodrush_orders_cancelled_total Orders cancelled.",
    "# TYPE foodrush_orders_cancelled_total counter",
    `foodrush_orders_cancelled_total ${safeOrdersCancelled}`,
    "# HELP foodrush_orders_refunded_total Orders refunded.",
    "# TYPE foodrush_orders_refunded_total counter",
    `foodrush_orders_refunded_total ${safeOrdersRefunded}`,
    "# HELP foodrush_orders_active Active (in-progress) orders.",
    "# TYPE foodrush_orders_active gauge",
    `foodrush_orders_active ${active}`,
    "# HELP foodrush_payments_failed_total Failed payments.",
    "# TYPE foodrush_payments_failed_total counter",
    `foodrush_payments_failed_total ${safePaymentsFailed}`,
    "# HELP foodrush_users_total Registered users.",
    "# TYPE foodrush_users_total gauge",
    `foodrush_users_total ${safeUsersTotal}`,
    "# HELP foodrush_restaurants_total Registered restaurants.",
    "# TYPE foodrush_restaurants_total gauge",
    `foodrush_restaurants_total ${safeRestaurantsTotal}`,
    "# HELP foodrush_riders_total Registered riders.",
    "# TYPE foodrush_riders_total gauge",
    `foodrush_riders_total ${safeRidersTotal}`,
  ].join("\n");
}

/**
 * Prometheus-compatible metrics endpoint (scrape target for the
 * Prometheus/Grafana monitoring stack).
 */
export async function GET() {
  try {
    const { db } = await import("@/db");
    const [
      [usersTotal],
      [restaurantsTotal],
      [ridersTotal],
      [ordersTotal],
      [ordersDelivered],
      [ordersCancelled],
      [ordersRefunded],
      [paymentsFailed],
    ] = await Promise.all([
      db.select({ v: count() }).from(users),
      db.select({ v: count() }).from(restaurants),
      db.select({ v: count() }).from(deliveryRiders),
      db.select({ v: count() }).from(orders),
      db.select({ v: count() }).from(orders).where(eq(orders.status, "delivered")),
      db.select({ v: count() }).from(orders).where(eq(orders.status, "cancelled")),
      db.select({ v: count() }).from(orders).where(eq(orders.status, "refunded")),
      db.select({ v: count() }).from(payments).where(eq(payments.status, "failed")),
    ]);

    const body = buildPrometheusMetrics({
      usersTotal: usersTotal?.v,
      restaurantsTotal: restaurantsTotal?.v,
      ridersTotal: ridersTotal?.v,
      ordersTotal: ordersTotal?.v,
      ordersDelivered: ordersDelivered?.v,
      ordersCancelled: ordersCancelled?.v,
      ordersRefunded: ordersRefunded?.v,
      paymentsFailed: paymentsFailed?.v,
    });

    return new Response(body + "\n", {
      headers: { "Content-Type": "text/plain; version=0.0.4" },
    });
  } catch {
    return new Response(
      buildPrometheusMetrics({
        usersTotal: 0,
        restaurantsTotal: 0,
        ridersTotal: 0,
        ordersTotal: 0,
        ordersDelivered: 0,
        ordersCancelled: 0,
        ordersRefunded: 0,
        paymentsFailed: 0,
      }) + "\n",
      {
        headers: { "Content-Type": "text/plain; version=0.0.4" },
      },
    );
  }
}
