import { describe, expect, it } from "vitest";
import { buildPrometheusMetrics } from "@/app/api/metrics/route";

describe("metrics export", () => {
  it("builds a valid Prometheus document with zero-safe values", () => {
    const metrics = buildPrometheusMetrics({
      usersTotal: 45,
      restaurantsTotal: 20,
      ridersTotal: 10,
      ordersTotal: 0,
      ordersDelivered: 0,
      ordersCancelled: 0,
      ordersRefunded: 0,
      paymentsFailed: 0,
    });

    expect(metrics).toContain("# HELP foodrush_orders_total Total orders placed.");
    expect(metrics).toContain("foodrush_orders_total 0");
    expect(metrics).toContain("foodrush_users_total 45");
    expect(metrics).toContain("foodrush_restaurants_total 20");
    expect(metrics).toContain("foodrush_riders_total 10");
    expect(metrics).toContain("foodrush_orders_active 0");
  });

  it("coerces missing values to zero instead of emitting invalid output", () => {
    const metrics = buildPrometheusMetrics({
      usersTotal: undefined,
      restaurantsTotal: 0,
      ridersTotal: undefined,
      ordersTotal: null,
      ordersDelivered: 0,
      ordersCancelled: 0,
      ordersRefunded: 0,
      paymentsFailed: NaN,
    } as any);

    expect(metrics).toContain("foodrush_users_total 0");
    expect(metrics).toContain("foodrush_riders_total 0");
    expect(metrics).toContain("foodrush_orders_total 0");
    expect(metrics).toContain("foodrush_payments_failed_total 0");
  });
});
