import { db } from "@/db";
import { addresses } from "@/db/schema";
import { asc, eq } from "drizzle-orm";
import { requireAuth } from "@/lib/auth";
import { createAddressSchema } from "@/lib/validators";
import { ok, created, fail } from "@/lib/http";

export const dynamic = "force-dynamic";

export async function GET(req: Request) {
  try {
    const actor = await requireAuth(req);
    const list = await db.query.addresses.findMany({
      where: eq(addresses.userId, actor.id),
      orderBy: asc(addresses.id),
    });
    return ok({ addresses: list });
  } catch (err) {
    return fail(err);
  }
}

export async function POST(req: Request) {
  try {
    const actor = await requireAuth(req);
    const body = await req.json();
    const data = createAddressSchema.parse(body);

    const address = await db.transaction(async (tx) => {
      if (data.isDefault) {
        await tx
          .update(addresses)
          .set({ isDefault: false })
          .where(eq(addresses.userId, actor.id));
      }
      const [created] = await tx
        .insert(addresses)
        .values({ ...data, userId: actor.id, isDefault: data.isDefault ?? false })
        .returning();
      return created;
    });

    return created({ address });
  } catch (err) {
    return fail(err);
  }
}
