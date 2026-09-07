import { db } from "@/db";
import { users } from "@/db/schema";
import { asc } from "drizzle-orm";
import { requireAuth, requireRole, publicUser } from "@/lib/auth";
import { ok, fail } from "@/lib/http";

export const dynamic = "force-dynamic";

export async function GET(req: Request) {
  try {
    const actor = await requireAuth(req);
    requireRole(actor, ["admin"]);

    const list = await db.query.users.findMany({ orderBy: asc(users.id) });
    return ok({ users: list.map(publicUser) });
  } catch (err) {
    return fail(err);
  }
}
