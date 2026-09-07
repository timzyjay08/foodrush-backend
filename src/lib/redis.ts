import Redis from "ioredis";

/**
 * Lazy, optional Redis client.
 *
 * Redis is used for cross-instance concerns that an in-memory implementation
 * cannot solve behind a load balancer:
 *   - real-time pub/sub (SSE fan-out across backend replicas)
 *   - distributed rate limiting
 *   - (future) caching, queues, sessions
 *
 * When REDIS_URL is not configured, all consumers fall back to safe in-memory
 * behavior, so the app still runs correctly as a single instance (e.g. local
 * dev or this sandbox). Configure REDIS_URL in production to enable horizontal
 * scaling.
 */

const globalForRedis = globalThis as typeof globalThis & {
  __foodrushRedis?: Redis | null;
};

export function getRedis(): Redis | null {
  const url = process.env.REDIS_URL;
  if (!url) return null;

  if (globalForRedis.__foodrushRedis !== undefined) {
    return globalForRedis.__foodrushRedis;
  }

  const client = new Redis(url, {
    maxRetriesPerRequest: 2,
    enableReadyCheck: true,
    enableOfflineQueue: false,
    connectTimeout: 5000,
    retryStrategy: (times) => (times > 5 ? null : Math.min(times * 500, 5000)),
  });

  // Swallow errors — callers treat Redis as best-effort.
  client.on("error", () => {});

  globalForRedis.__foodrushRedis = client;
  return client;
}

/** True when Redis is configured and reachable. */
export async function isRedisReady(): Promise<boolean> {
  const redis = getRedis();
  if (!redis) return false;
  if (redis.status === "ready") return true;
  try {
    await redis.ping();
    return true;
  } catch {
    return false;
  }
}

export function isRedisConfigured(): boolean {
  return Boolean(process.env.REDIS_URL);
}
