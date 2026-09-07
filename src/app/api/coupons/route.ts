import { db } from "@/db";
import { coupons } from "@/db/schema";
import { asc, eq } from "drizzle-orm";
import { requireAuth, requireRole } from "@/lib/auth";
import { createCouponSchema } from "@/lib/validators";
import { ok, created, fail, ApiError } from "@/lib/http";

export const dynamic = "force-dynamic";

export async function GET(req: Request) {
  try {
    const actor = await requireAuth(req);
    requireRole(actor, ["admin"]);

    const list = await db.query.coupons.findMany({ orderBy: asc(coupons.code) });
    return ok({ coupons: list });
  } catch (err) {
    return fail(err);
  }
}

export async function POST(req: Request) {
  try {
    const actor = await requireAuth(req);
    requireRole(actor, ["admin"]);

    const body = await req.json();
    const data = createCouponSchema.parse(body);

    const existing = await db.query.coupons.findFirst({ where: eq(coupons.code, data.code) });
    if (existing) throw new ApiError(409, "A coupon with this code already exists", "CODE_TAKEN");

    const [coupon] = await db
      .insert(coupons)
      .values({
        code: data.code,
        discountType: data.discountType,
        discountValue: data.discountValue,
        maxUses: data.maxUses ?? 100,
        isActive: data.isActive ?? true,
        expiresAt: data.expiresAt ? new Date(data.expiresAt) : undefined,
      })
      .returning();

    return created({ coupon });
  } catch (err) {
    return fail(err);
  }
}
