import { db } from "@/db";
import { favorites } from "@/db/schema";
import { and, eq } from "drizzle-orm";
import { requireAuth } from "@/lib/auth";
import { ok, fail, parseId, ApiError } from "@/lib/http";

export const dynamic = "force-dynamic";

type Ctx = { params: Promise<{ id: string }> };

export async function DELETE(req: Request, ctx: Ctx) {
  try {
    const { id } = await ctx.params;
    const restaurantId = parseId(id);

    const actor = await requireAuth(req);

    const existing = await db.query.favorites.findFirst({
      where: and(eq(favorites.userId, actor.id), eq(favorites.restaurantId, restaurantId)),
    });
    if (!existing) throw new ApiError(404, "Favorite not found", "NOT_FOUND");

    await db.delete(favorites).where(eq(favorites.id, existing.id));
    return ok({ removed: true, restaurantId });
  } catch (err) {
    return fail(err);
  }
}
