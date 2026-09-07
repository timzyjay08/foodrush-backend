import { db } from "@/db";
import { addresses } from "@/db/schema";
import { eq } from "drizzle-orm";
import { requireAuth } from "@/lib/auth";
import { updateAddressSchema } from "@/lib/validators";
import { ok, fail, parseId, ApiError } from "@/lib/http";

export const dynamic = "force-dynamic";

type Ctx = { params: Promise<{ id: string }> };

export async function PATCH(req: Request, ctx: Ctx) {
  try {
    const { id } = await ctx.params;
    const addressId = parseId(id);

    const actor = await requireAuth(req);

    const existing = await db.query.addresses.findFirst({
      where: eq(addresses.id, addressId),
    });
    if (!existing) throw new ApiError(404, "Address not found", "NOT_FOUND");
    if (existing.userId !== actor.id) {
      throw new ApiError(403, "You do not own this address", "FORBIDDEN");
    }

    const body = await req.json();
    const data = updateAddressSchema.parse(body);
    if (Object.keys(data).length === 0) {
      throw new ApiError(400, "No fields to update", "EMPTY_UPDATE");
    }

    const [updated] = await db.transaction(async (tx) => {
      if (data.isDefault) {
        await tx
          .update(addresses)
          .set({ isDefault: false })
          .where(eq(addresses.userId, actor.id));
      }
      return tx
        .update(addresses)
        .set(data)
        .where(eq(addresses.id, addressId))
        .returning();
    });

    return ok({ address: updated });
  } catch (err) {
    return fail(err);
  }
}

export async function DELETE(req: Request, ctx: Ctx) {
  try {
    const { id } = await ctx.params;
    const addressId = parseId(id);

    const actor = await requireAuth(req);

    const existing = await db.query.addresses.findFirst({
      where: eq(addresses.id, addressId),
    });
    if (!existing) throw new ApiError(404, "Address not found", "NOT_FOUND");
    if (existing.userId !== actor.id) {
      throw new ApiError(403, "You do not own this address", "FORBIDDEN");
    }

    await db.delete(addresses).where(eq(addresses.id, addressId));
    return ok({ deleted: true, id: addressId });
  } catch (err) {
    return fail(err);
  }
}
