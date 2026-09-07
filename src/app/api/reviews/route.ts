import { db } from "@/db";
import { reviews, restaurants, users } from "@/db/schema";
import { and, desc, eq } from "drizzle-orm";
import { requireAuth } from "@/lib/auth";
import { createReviewSchema } from "@/lib/validators";
import { ok, created, fail, ApiError, round2 } from "@/lib/http";

export const dynamic = "force-dynamic";

export async function GET(req: Request) {
  try {
    const url = new URL(req.url);
    const restaurantId = url.searchParams.get("restaurantId");
    const riderId = url.searchParams.get("riderId");

    const conditions = [];
    if (restaurantId) conditions.push(eq(reviews.restaurantId, Number(restaurantId)));
    if (riderId) conditions.push(eq(reviews.riderId, Number(riderId)));

    const list = await db.query.reviews.findMany({
      where: conditions.length ? and(...conditions) : undefined,
      orderBy: desc(reviews.createdAt),
      limit: 100,
    });

    const enriched = await Promise.all(
      list.map(async (review) => {
        const author = await db.query.users.findFirst({ where: eq(users.id, review.userId) });
        return { ...review, authorName: author?.name ?? "Anonymous" };
      }),
    );

    return ok({ reviews: enriched });
  } catch (err) {
    return fail(err);
  }
}

export async function POST(req: Request) {
  try {
    const actor = await requireAuth(req);
    const body = await req.json();
    const data = createReviewSchema.parse(body);

    if (!data.restaurantId && !data.riderId) {
      throw new ApiError(400, "A review must target a restaurant or a rider", "MISSING_TARGET");
    }

    // Prevent duplicate reviews for the same order + target.
    if (data.orderId) {
      const dup = await db.query.reviews.findFirst({
        where: data.restaurantId
          ? and(eq(reviews.orderId, data.orderId), eq(reviews.restaurantId, data.restaurantId))
          : and(eq(reviews.orderId, data.orderId), eq(reviews.riderId, data.riderId ?? 0)),
      });
      if (dup) {
        throw new ApiError(409, "You have already reviewed this", "DUPLICATE_REVIEW");
      }
    }

    const [review] = await db
      .insert(reviews)
      .values({ userId: actor.id, restaurantId: data.restaurantId, riderId: data.riderId, orderId: data.orderId, rating: data.rating, comment: data.comment })
      .returning();

    // Update restaurant aggregate rating when reviewing a restaurant.
    if (data.restaurantId) {
      const restaurant = await db.query.restaurants.findFirst({ where: eq(restaurants.id, data.restaurantId) });
      if (restaurant) {
        const newCount = restaurant.ratingCount + 1;
        const newRating = round2((restaurant.rating * restaurant.ratingCount + data.rating) / newCount);
        await db.update(restaurants).set({ rating: newRating, ratingCount: newCount }).where(eq(restaurants.id, restaurant.id));
      }
    }

    return created({ review });
  } catch (err) {
    return fail(err);
  }
}
