import { db } from "@/db";
import { notifications } from "@/db/schema";
import { desc, eq } from "drizzle-orm";
import { requireAuth } from "@/lib/auth";
import { ok, fail } from "@/lib/http";

export const dynamic = "force-dynamic";

export async function GET(req: Request) {
  try {
    const actor = await requireAuth(req);
    const list = await db.query.notifications.findMany({
      where: eq(notifications.userId, actor.id),
      orderBy: desc(notifications.createdAt),
      limit: 50,
    });
    const unread = list.filter((n) => !n.isRead).length;
    return ok({ notifications: list, unreadCount: unread });
  } catch (err) {
    return fail(err);
  }
}
