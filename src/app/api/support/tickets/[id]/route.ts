import { db } from "@/db";
import { supportTickets, supportMessages } from "@/db/schema";
import { asc, eq } from "drizzle-orm";
import { requireAuth, requireRole } from "@/lib/auth";
import { addTicketMessageSchema, updateTicketStatusSchema } from "@/lib/validators";
import { ok, created, fail, parseId, ApiError } from "@/lib/http";

export const dynamic = "force-dynamic";

type Ctx = { params: Promise<{ id: string }> };

async function getTicket(actor: { id: number; role: string }, ticketId: number) {
  const ticket = await db.query.supportTickets.findFirst({ where: eq(supportTickets.id, ticketId) });
  if (!ticket) throw new ApiError(404, "Ticket not found", "NOT_FOUND");
  if (ticket.userId !== actor.id && actor.role !== "admin") {
    throw new ApiError(403, "You cannot view this ticket", "FORBIDDEN");
  }
  return ticket;
}

export async function GET(req: Request, ctx: Ctx) {
  try {
    const { id } = await ctx.params;
    const ticketId = parseId(id);
    const actor = await requireAuth(req);

    const ticket = await getTicket(actor, ticketId);
    const messages = await db.query.supportMessages.findMany({
      where: eq(supportMessages.ticketId, ticketId),
      orderBy: [asc(supportMessages.createdAt)],
    });

    return ok({ ticket, messages });
  } catch (err) {
    return fail(err);
  }
}

export async function PATCH(req: Request, ctx: Ctx) {
  try {
    const { id } = await ctx.params;
    const ticketId = parseId(id);
    const actor = await requireAuth(req);
    requireRole(actor, ["admin"]);

    const ticket = await getTicket(actor, ticketId);
    const body = await req.json();
    const { status } = updateTicketStatusSchema.parse(body);

    const [updated] = await db
      .update(supportTickets)
      .set({ status, updatedAt: new Date() })
      .where(eq(supportTickets.id, ticket.id))
      .returning();

    return ok({ ticket: updated });
  } catch (err) {
    return fail(err);
  }
}
