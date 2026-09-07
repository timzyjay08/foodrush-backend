import { db } from "@/db";
import { menuItems } from "@/db/schema";
import { count, eq } from "drizzle-orm";
import { ok, fail } from "@/lib/http";

export const dynamic = "force-dynamic";

export async function GET() {
  try {
    // Derive categories from live menu items with counts.
    const rows = await db
      .select({ category: menuItems.category, value: count() })
      .from(menuItems)
      .where(eq(menuItems.isAvailable, true))
      .groupBy(menuItems.category);

    const categories = rows
      .filter((r) => r.category)
      .map((r) => ({ name: r.category as string, itemCount: r.value }))
      .sort((a, b) => b.itemCount - a.itemCount);

    return ok({ categories });
  } catch (err) {
    return fail(err);
  }
}
