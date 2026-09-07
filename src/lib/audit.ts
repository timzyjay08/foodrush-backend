import { db } from "@/db";
import { auditLogs, orderStatusHistory } from "@/db/schema";
import type { OrderStatus } from "@/db/schema";

/**
 * Write an audit-log entry for an important action. Never throws — audit
 * failures must not break the main business flow.
 */
export async function recordAudit(input: {
  actorId?: number | null;
  action: string;
  resource: string;
  resourceId?: string | number | null;
  metadata?: Record<string, unknown>;
  ip?: string | null;
}): Promise<void> {
  try {
    await db.insert(auditLogs).values({
      actorId: input.actorId ?? null,
      action: input.action,
      resource: input.resource,
      resourceId: input.resourceId != null ? String(input.resourceId) : null,
      metadata: input.metadata ?? {},
      ip: input.ip ?? null,
    });
  } catch (err) {
    console.error("[audit] failed to write audit log", err);
  }
}

/**
 * Record an order transition in the status-history table (audit trail).
 * Never throws.
 */
export async function recordOrderStatus(
  orderId: number,
  fromStatus: OrderStatus | null,
  toStatus: OrderStatus,
  actorId?: number | null,
  note?: string | null,
): Promise<void> {
  try {
    await db.insert(orderStatusHistory).values({
      orderId,
      fromStatus,
      toStatus,
      actorId: actorId ?? null,
      note: note ?? null,
    });
  } catch (err) {
    console.error("[audit] failed to write status history", err);
  }
}
