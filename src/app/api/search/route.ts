import { db } from "@/db";
import { restaurants, menuItems } from "@/db/schema";
import { and, eq, ilike, or } from "drizzle-orm";
import { ok, fail } from "@/lib/http";

export const dynamic = "force-dynamic";

/**
 * Unified search across restaurants, food items, and categories.
 * GET /api/search?q=jollof
 */
export async function GET(req: Request) {
  try {
    const url = new URL(req.url);
    const q = (url.searchParams.get("q") ?? "").trim();
    const cuisine = url.searchParams.get("cuisine")?.trim();
    const limit = Math.min(50, Math.max(1, parseInt(url.searchParams.get("limit") ?? "20", 10) || 20));

    if (!q) {
      return ok({ restaurants: [], foods: [], categories: [], total: 0 });
    }

    const like = `%${q}%`;

    // Restaurants matching name or cuisine.
    const restaurantMatches = await db.query.restaurants.findMany({
      where: or(ilike(restaurants.name, like), ilike(restaurants.cuisine, like))!,
      limit,
    });

    // Food items matching name, description, or category.
    const foodConditions = [ilike(menuItems.name, like)];
    if (cuisine) foodConditions.push(eq(menuItems.category, cuisine));
    const foodMatches = await db.query.menuItems.findMany({
      where: and(...foodConditions),
      limit,
    });

    // Derive matching categories.
    const categorySet = new Set<string>();
    for (const f of foodMatches) if (f.category) categorySet.add(f.category);

    return ok({
      restaurants: restaurantMatches,
      foods: foodMatches,
      categories: Array.from(categorySet),
      total: restaurantMatches.length + foodMatches.length,
    });
  } catch (err) {
    return fail(err);
  }
}
