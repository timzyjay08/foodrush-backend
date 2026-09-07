import { db } from "@/db";
import { supportTickets, supportMessages } from "@/db/schema";
import { desc, eq } from "drizzle-orm";
import { requireAuth, requireRole } from "@/lib/auth";
import { createTicketSchema } from "@/lib/validators";
import { ok, created, fail } from "@/lib/http";

export const dynamic = "force-dynamic";

export async function GET(req: Request) {
  try {
    const actor = await requireAuth(req);
    const list = await db.query.supportTickets.findMany({
      where: actor.role === "admin" ? undefined : eq(supportTickets.userId, actor.id),
      orderBy: [desc(supportTickets.createdAt)],
      limit: 100,
    });
    return ok({ tickets: list });
  } catch (err) {
    return fail(err);
  }
}

export async function POST(req: Request) {
  try {
    const actor = await requireAuth(req);
    requireRole(actor, ["customer", "admin"]);

    const body = await req.json();
    const data = createTicketSchema.parse(body);

    const [ticket] = await db
      .insert(supportTickets)
      .values({
        userId: actor.id,
        subject: data.subject,
        category: data.category ?? "general",
        orderId: data.orderId,
      })
      .returning();

    await db.insert(supportMessages).values({
      ticketId: ticket.id,
      senderId: actor.id,
      body: data.body,
    });

    return created({ ticket });
  } catch (err) {
    return fail(err);
  }
}
