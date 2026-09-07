import { db } from "@/db";
import { users } from "@/db/schema";
import { eq } from "drizzle-orm";
import { requireAuth, requireRole, publicUser } from "@/lib/auth";
import { updateUserSchema } from "@/lib/validators";
import { hashPassword } from "@/lib/password";
import { ok, fail, parseId, ApiError } from "@/lib/http";

export const dynamic = "force-dynamic";

type Ctx = { params: Promise<{ id: string }> };

export async function PATCH(req: Request, ctx: Ctx) {
  try {
    const { id } = await ctx.params;
    const targetId = parseId(id);

    const actor = await requireAuth(req);
    const isSelf = actor.id === targetId;

    // Only admins can touch other users; a user may edit their own profile.
    if (!isSelf) {
      requireRole(actor, ["admin"]);
    }

    const body = await req.json();
    const data = updateUserSchema.parse(body);

    // Only admins may change roles.
    if (data.role && actor.role !== "admin") {
      throw new ApiError(403, "Only admins can change a user role", "FORBIDDEN");
    }

    const updates: Record<string, unknown> = {};
    if (data.name !== undefined) updates.name = data.name;
    if (data.phone !== undefined) updates.phone = data.phone;
    if (data.role !== undefined) updates.role = data.role;
    if (data.password !== undefined) {
      updates.passwordHash = await hashPassword(data.password);
    }
    if (data.isSuspended !== undefined) {
      // Only admins may suspend/unsuspend accounts.
      if (actor.role !== "admin") {
        throw new ApiError(403, "Only admins can suspend or unsuspend accounts", "FORBIDDEN");
      }
      updates.isSuspended = data.isSuspended;
    }

    if (Object.keys(updates).length === 0) {
      throw new ApiError(400, "No fields to update", "EMPTY_UPDATE");
    }

    const [updated] = await db
      .update(users)
      .set(updates)
      .where(eq(users.id, targetId))
      .returning();

    if (!updated) throw new ApiError(404, "User not found", "NOT_FOUND");

    return ok({ user: publicUser(updated) });
  } catch (err) {
    return fail(err);
  }
}
