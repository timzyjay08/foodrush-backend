import { checkReadiness } from "../route";

export const dynamic = "force-dynamic";

/**
 * Readiness probe — the instance is healthy and can serve traffic.
 * Verifies the database (and Redis when configured). The load balancer should
 * remove this instance from the pool when this returns a non-200.
 */
export async function GET() {
  const dbOk = await checkReadiness();

  if (!dbOk) {
    return Response.json(
      { status: "not_ready", database: "disconnected" },
      { status: 503 },
    );
  }

  return Response.json({
    status: "ready",
    database: "connected",
    version: "1.0.0",
    timestamp: new Date().toISOString(),
  });
}
