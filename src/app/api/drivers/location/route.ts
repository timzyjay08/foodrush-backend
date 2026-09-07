import { db } from "@/db";
import { driverLocations, deliveries, orders } from "@/db/schema";
import { and, eq, isNull, desc } from "drizzle-orm";
import { requireAuth } from "@/lib/auth";
import { updateDriverLocationSchema } from "@/lib/validators";
import { ok, fail, ApiError } from "@/lib/http";
import { publishDriverLocation } from "@/lib/events";

export const dynamic = "force-dynamic";

/**
 * Rider posts their current GPS position. The backend stores it and broadcasts
 * it in real time to the customer tracking the rider's active delivery.
 *
 * Privacy: a rider's location is only ever sent to the customer of the
 * rider's in-progress order — never to unrelated users.
 */
export async function POST(req: Request) {
  try {
    const actor = await requireAuth(req);
    if (actor.role !== "rider") {
      throw new ApiError(403, "Only riders can report their location", "FORBIDDEN");
    }

    const body = await req.json();
    const { latitude, longitude } = updateDriverLocationSchema.parse(body);

    // Upsert the driver's latest position (one row per driver).
    const existing = await db.query.driverLocations.findFirst({
      where: eq(driverLocations.driverId, actor.id),
    });

    const updatedAt = new Date().toISOString();
    if (existing) {
      await db
        .update(driverLocations)
        .set({ latitude, longitude, updatedAt: new Date() })
        .where(eq(driverLocations.id, existing.id));
    } else {
      await db.insert(driverLocations).values({
        driverId: actor.id,
        latitude,
        longitude,
      });
    }

    // Find the rider's active delivery to broadcast to the right customer.
    const active = await db.query.deliveries.findFirst({
      where: and(eq(deliveries.riderId, actor.id), isNull(deliveries.deliveredAt)),
      orderBy: [desc(deliveries.createdAt)],
    });

    let orderId: number | null = null;
    if (active) {
      const order = await db.query.orders.findFirst({ where: eq(orders.id, active.orderId) });
      if (order && order.status !== "delivered" && order.status !== "cancelled") {
        orderId = order.id;
        publishDriverLocation(order.userId, {
          driverId: actor.id,
          orderId,
          latitude,
          longitude,
          updatedAt,
        });
      }
    }

    return ok({ latitude, longitude, updatedAt, orderId });
  } catch (err) {
    return fail(err);
  }
}

/** Customer fetches the rider's latest position for an order (on-demand). */
export async function GET(req: Request) {
  try {
    const actor = await requireAuth(req);
    const url = new URL(req.url);
    const orderId = Number(url.searchParams.get("orderId"));

    if (!Number.isInteger(orderId) || orderId <= 0) {
      throw new ApiError(400, "orderId is required", "INVALID_ID");
    }

    const order = await db.query.orders.findFirst({ where: eq(orders.id, orderId) });
    if (!order) throw new ApiError(404, "Order not found", "NOT_FOUND");

    const isCustomer = order.userId === actor.id;
    const isRider = order.riderId === actor.id;
    if (!isCustomer && !isRider && actor.role !== "admin") {
      throw new ApiError(403, "You cannot view this location", "FORBIDDEN");
    }
    if (!order.riderId) throw new ApiError(404, "No rider assigned yet", "NO_RIDER");

    const loc = await db.query.driverLocations.findFirst({
      where: eq(driverLocations.driverId, order.riderId),
    });

    if (!loc) throw new ApiError(404, "Rider location not available yet", "NO_LOCATION");

    return ok({ driverId: order.riderId, orderId, latitude: loc.latitude, longitude: loc.longitude, updatedAt: loc.updatedAt });
  } catch (err) {
    return fail(err);
  }
}
