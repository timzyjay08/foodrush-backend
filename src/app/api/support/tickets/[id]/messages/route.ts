import { db } from "@/db";
import { supportTickets, supportMessages } from "@/db/schema";
import { eq } from "drizzle-orm";
import { requireAuth } from "@/lib/auth";
import { addTicketMessageSchema } from "@/lib/validators";
import { created, fail, parseId, ApiError } from "@/lib/http";

export const dynamic = "force-dynamic";

type Ctx = { params: Promise<{ id: string }> };

export async function POST(req: Request, ctx: Ctx) {
  try {
    const { id } = await ctx.params;
    const ticketId = parseId(id);
    const actor = await requireAuth(req);

    const ticket = await db.query.supportTickets.findFirst({ where: eq(supportTickets.id, ticketId) });
    if (!ticket) throw new ApiError(404, "Ticket not found", "NOT_FOUND");
    if (ticket.userId !== actor.id && actor.role !== "admin") {
      throw new ApiError(403, "You cannot reply to this ticket", "FORBIDDEN");
    }
    if (ticket.status === "closed") {
      throw new ApiError(409, "This ticket is closed", "TICKET_CLOSED");
    }

    const body = await req.json();
    const { body: text } = addTicketMessageSchema.parse(body);

    const [message] = await db
      .insert(supportMessages)
      .values({ ticketId, senderId: actor.id, body: text })
      .returning();

    return created({ message });
  } catch (err) {
    return fail(err);
  }
}
