import { db } from "@/db";
import { menuItems, foodItemOptions, coupons, restaurants } from "@/db/schema";
import { eq, inArray } from "drizzle-orm";
import { requireAuth } from "@/lib/auth";
import { createOrderSchema } from "@/lib/validators";
import { ok, fail, ApiError, calcDeliveryFee, calcServiceFee, round2 } from "@/lib/http";

export const dynamic = "force-dynamic";

/**
 * Server-side checkout preview — the single authoritative price breakdown.
 * The frontend must display these numbers, never its own calculation.
 */
export async function POST(req: Request) {
  try {
    const actor = await requireAuth(req);
    if (actor.role !== "customer" && actor.role !== "admin") {
      throw new ApiError(403, "Only customers can checkout", "FORBIDDEN");
    }

    const body = await req.json();
    const data = createOrderSchema.parse(body);

    const restaurant = await db.query.restaurants.findFirst({ where: eq(restaurants.id, data.restaurantId) });
    if (!restaurant) throw new ApiError(404, "Restaurant not found", "NOT_FOUND");
    if (!restaurant.isOpen) throw new ApiError(409, "Restaurant is closed", "RESTAURANT_CLOSED");

    const itemIds = data.items.map((i) => i.menuItemId);
    const found = await db.query.menuItems.findMany({ where: inArray(menuItems.id, itemIds) });
    const byId = new Map(found.map((m) => [m.id, m]));

    const optionRows = await db.query.foodItemOptions.findMany({ where: inArray(foodItemOptions.menuItemId, itemIds) });
    const optionsByItem = new Map<number, { id: number; price: number }[]>();
    for (const o of optionRows) {
      const arr = optionsByItem.get(o.menuItemId) ?? [];
      arr.push(o);
      optionsByItem.set(o.menuItemId, arr);
    }

    let subtotal = 0;
    const lines = data.items.map((line) => {
      const item = byId.get(line.menuItemId);
      if (!item || item.restaurantId !== restaurant.id) {
        throw new ApiError(400, `Menu item #${line.menuItemId} does not belong to this restaurant`, "INVALID_ITEM");
      }
      if (!item.isAvailable) throw new ApiError(409, `"${item.name}" is unavailable`, "ITEM_UNAVAILABLE");

      const selected = new Set(line.optionIds ?? []);
      const addons = (optionsByItem.get(item.id) ?? []).filter((o) => selected.has(o.id));
      const unit = round2(item.price + addons.reduce((a, o) => a + o.price, 0));
      const lineTotal = round2(unit * line.quantity);
      subtotal += lineTotal;
      return { menuItemId: item.id, name: item.name, unitPrice: unit, quantity: line.quantity, lineTotal };
    });

    const subtotalRounded = round2(subtotal);
    const distanceKm = data.deliveryDistanceKm ?? 3;
    const deliveryFee = calcDeliveryFee(distanceKm);
    const serviceFee = calcServiceFee(subtotalRounded);

    // Coupon
    let discount = 0;
    let couponCode: string | null = null;
    if (data.couponCode) {
      const coupon = await db.query.coupons.findFirst({ where: eq(coupons.code, data.couponCode.toUpperCase()) });
      if (coupon && coupon.isActive && (!coupon.expiresAt || coupon.expiresAt >= new Date()) && coupon.timesUsed < coupon.maxUses) {
        discount = coupon.discountType === "percentage"
          ? round2((subtotalRounded * coupon.discountValue) / 100)
          : round2(Math.min(coupon.discountValue, subtotalRounded));
        discount = round2(Math.min(discount, subtotalRounded + deliveryFee + serviceFee));
        couponCode = coupon.code;
      }
    }

    let total = round2(subtotalRounded + deliveryFee + serviceFee - discount);

    // Minimum order enforcement.
    if (subtotalRounded < restaurant.minimumOrder) {
      throw new ApiError(400, `Minimum order is ₦${restaurant.minimumOrder}`, "MINIMUM_ORDER");
    }
    if (total < 0) total = 0;

    return ok({
      restaurantId: restaurant.id,
      restaurantName: restaurant.name,
      subtotal: subtotalRounded,
      deliveryFee,
      serviceFee,
      discount,
      total,
      coupon: couponCode ? { code: couponCode, discount } : null,
      distanceKm,
      currency: "NGN",
      lines,
    });
  } catch (err) {
    return fail(err);
  }
}
