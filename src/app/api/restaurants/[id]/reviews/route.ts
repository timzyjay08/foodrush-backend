import { db } from "@/db";
import { reviews, restaurants, users, orders } from "@/db/schema";
import { desc, eq } from "drizzle-orm";
import { requireAuth } from "@/lib/auth";
import { createReviewSchema } from "@/lib/validators";
import { ok, created, fail, parseId, ApiError } from "@/lib/http";

export const dynamic = "force-dynamic";

type Ctx = { params: Promise<{ id: string }> };

function round2(n: number): number {
  return Math.round(n * 100) / 100;
}

export async function GET(_req: Request, ctx: Ctx) {
  try {
    const { id } = await ctx.params;
    const restaurantId = parseId(id);

    const restaurant = await db.query.restaurants.findFirst({
      where: eq(restaurants.id, restaurantId),
    });
    if (!restaurant) throw new ApiError(404, "Restaurant not found", "NOT_FOUND");

    const list = await db.query.reviews.findMany({
      where: eq(reviews.restaurantId, restaurantId),
      orderBy: desc(reviews.createdAt),
    });

    const enriched = await Promise.all(
      list.map(async (review) => {
        const author = await db.query.users.findFirst({
          where: eq(users.id, review.userId),
        });
        return { ...review, authorName: author?.name ?? "Anonymous" };
      }),
    );

    return ok({ reviews: enriched });
  } catch (err) {
    return fail(err);
  }
}

export async function POST(req: Request, ctx: Ctx) {
  try {
    const { id } = await ctx.params;
    const restaurantId = parseId(id);

    const actor = await requireAuth(req);

    const restaurant = await db.query.restaurants.findFirst({
      where: eq(restaurants.id, restaurantId),
    });
    if (!restaurant) throw new ApiError(404, "Restaurant not found", "NOT_FOUND");

    const body = await req.json();
    const data = createReviewSchema.parse(body);

    // Validate an optional order reference: it must exist and belong to the reviewer.
    if (data.orderId !== undefined) {
      const order = await db.query.orders.findFirst({
        where: eq(orders.id, data.orderId),
      });
      if (!order || order.userId !== actor.id) {
        throw new ApiError(400, "Invalid order reference", "INVALID_ORDER");
      }
    }

    const [review] = await db
      .insert(reviews)
      .values({
        userId: actor.id,
        restaurantId,
        orderId: data.orderId,
        rating: data.rating,
        comment: data.comment,
      })
      .returning();

    // Update the restaurant's aggregate rating.
    const newCount = restaurant.ratingCount + 1;
    const newRating = round2(
      (restaurant.rating * restaurant.ratingCount + data.rating) / newCount,
    );
    await db
      .update(restaurants)
      .set({ rating: newRating, ratingCount: newCount })
      .where(eq(restaurants.id, restaurantId));

    return created({ review });
  } catch (err) {
    return fail(err);
  }
}
