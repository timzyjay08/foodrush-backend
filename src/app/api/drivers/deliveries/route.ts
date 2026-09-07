import { db } from "@/db";
import { deliveries } from "@/db/schema";
import { desc, eq } from "drizzle-orm";
import { requireAuth } from "@/lib/auth";
import { ok, fail, ApiError } from "@/lib/http";

export const dynamic = "force-dynamic";

export async function GET(req: Request) {
  try {
    const actor = await requireAuth(req);
    if (actor.role !== "rider") {
      throw new ApiError(403, "Only riders can view their deliveries", "FORBIDDEN");
    }

    const list = await db.query.deliveries.findMany({
      where: eq(deliveries.riderId, actor.id),
      orderBy: [desc(deliveries.createdAt)],
      limit: 100,
    });

    return ok({ deliveries: list });
  } catch (err) {
    return fail(err);
  }
}
