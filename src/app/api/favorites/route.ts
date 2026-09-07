import { db } from "@/db";
import { favorites, restaurants } from "@/db/schema";
import { and, eq } from "drizzle-orm";
import { requireAuth } from "@/lib/auth";
import { ok, created, fail, ApiError } from "@/lib/http";
import { z } from "zod";

export const dynamic = "force-dynamic";

const addFavoriteSchema = z.object({ restaurantId: z.number().int().positive() });

export async function GET(req: Request) {
  try {
    const actor = await requireAuth(req);
    const list = await db.query.favorites.findMany({ where: eq(favorites.userId, actor.id) });
    const enriched = await Promise.all(
      list.map(async (f) => {
        const restaurant = await db.query.restaurants.findFirst({ where: eq(restaurants.id, f.restaurantId) });
        return { ...f, restaurant };
      }),
    );
    return ok({ favorites: enriched });
  } catch (err) {
    return fail(err);
  }
}

export async function POST(req: Request) {
  try {
    const actor = await requireAuth(req);
    const body = await req.json();
    const { restaurantId } = addFavoriteSchema.parse(body);

    const restaurant = await db.query.restaurants.findFirst({ where: eq(restaurants.id, restaurantId) });
    if (!restaurant) throw new ApiError(404, "Restaurant not found", "NOT_FOUND");

    const existing = await db.query.favorites.findFirst({
      where: and(eq(favorites.userId, actor.id), eq(favorites.restaurantId, restaurantId)),
    });
    if (existing) return ok({ favorite: existing, alreadyFavorited: true });

    const [favorite] = await db.insert(favorites).values({ userId: actor.id, restaurantId }).returning();
    return created({ favorite });
  } catch (err) {
    return fail(err);
  }
}
