import { db } from "@/db";
import { coupons } from "@/db/schema";
import { eq } from "drizzle-orm";
import { validateCouponSchema } from "@/lib/validators";
import { ok, fail, ApiError } from "@/lib/http";

export const dynamic = "force-dynamic";

/**
 * Validate a promo code for a prospective order and return the computed
 * discount. The authoritative total is still recalculated at order creation —
 * this endpoint just previews validity/discount to the frontend.
 */
export async function POST(req: Request) {
  try {
    const body = await req.json();
    const { code, restaurantId, subtotal } = validateCouponSchema.parse(body);

    const coupon = await db.query.coupons.findFirst({ where: eq(coupons.code, code.toUpperCase()) });
    if (!coupon) throw new ApiError(404, "Coupon not found", "INVALID_COUPON");

    if (!coupon.isActive) throw new ApiError(400, "Coupon is inactive", "INVALID_COUPON");
    if (coupon.expiresAt && coupon.expiresAt < new Date()) {
      throw new ApiError(400, "Coupon has expired", "INVALID_COUPON");
    }
    if (coupon.timesUsed >= coupon.maxUses) {
      throw new ApiError(400, "Coupon usage limit reached", "INVALID_COUPON");
    }

    let discount =
      coupon.discountType === "percentage"
        ? round2((subtotal * coupon.discountValue) / 100)
        : round2(Math.min(coupon.discountValue, subtotal));

    return ok({
      code: coupon.code,
      discountType: coupon.discountType,
      discount: Math.max(0, discount),
      valid: true,
    });
  } catch (err) {
    return fail(err);
  }
}

function round2(n: number): number {
  return Math.round(n * 100) / 100;
}
