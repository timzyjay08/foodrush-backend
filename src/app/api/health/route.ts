import { db } from "@/db";
import { sql } from "drizzle-orm";
import { isRedisConfigured, isRedisReady } from "@/lib/redis";

export const dynamic = "force-dynamic";

/**
 * Liveness probe — the process is up. Used by the load balancer / orchestrator
 * to decide whether to keep routing traffic to this instance.
 */
export async function GET() {
  const redisReady = await isRedisReady();

  return Response.json({
    status: "ok",
    version: "1.0.0",
    uptimeSeconds: Math.round(process.uptime()),
    redis: isRedisConfigured() ? (redisReady ? "connected" : "unavailable") : "disabled",
    timestamp: new Date().toISOString(),
  });
}

/** Shared readiness check reused by /api/health/ready. */
export async function checkReadiness(): Promise<boolean> {
  try {
    await db.execute(sql`select 1`);
    return !isRedisConfigured() || await isRedisReady();
  } catch {
    return false;
  }
}
