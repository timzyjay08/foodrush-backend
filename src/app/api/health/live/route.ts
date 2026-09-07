export const dynamic = "force-dynamic";

/**
 * Liveness probe — always 200 as long as the process is running.
 * The load balancer keeps routing to this instance while live.
 */
export function GET() {
  return Response.json({
    status: "live",
    uptimeSeconds: Math.round(process.uptime()),
    timestamp: new Date().toISOString(),
  });
}
