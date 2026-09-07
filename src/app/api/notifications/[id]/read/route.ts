import { db } from "@/db";
import { notifications } from "@/db/schema";
import { eq } from "drizzle-orm";
import { requireAuth } from "@/lib/auth";
import { ok, fail, parseId, ApiError } from "@/lib/http";

export const dynamic = "force-dynamic";

type Ctx = { params: Promise<{ id: string }> };

export async function PATCH(req: Request, ctx: Ctx) {
  try {
    const { id } = await ctx.params;
    const notificationId = parseId(id);

    const actor = await requireAuth(req);

    const notification = await db.query.notifications.findFirst({ where: eq(notifications.id, notificationId) });
    if (!notification) throw new ApiError(404, "Notification not found", "NOT_FOUND");
    if (notification.userId !== actor.id) throw new ApiError(403, "You do not own this notification", "FORBIDDEN");

    const [updated] = await db
      .update(notifications)
      .set({ isRead: true })
      .where(eq(notifications.id, notificationId))
      .returning();

    return ok({ notification: updated });
  } catch (err) {
    return fail(err);
  }
}
