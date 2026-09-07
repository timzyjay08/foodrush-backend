import { ApiError } from "./http";
import { getRedis } from "./redis";

/**
 * Sliding-window rate limiter.
 *
 * Uses Redis (atomic INCR + EXPIRE) when available so the limit is enforced
 * globally across all backend instances behind the load balancer. Falls back
 * to an in-memory fixed window for single-instance runs.
 */

interface Bucket {
  count: number;
  resetAt: number;
}

const memory = new Map<string, Bucket>();

// Keep the in-memory fallback from growing without bound.
const MAX_ENTRIES = 100_000;

export interface RateLimitOptions {
  /** Stable identifier, e.g. `auth:login:${ip}`. */
  key: string;
  /** Maximum requests allowed per window. */
  limit: number;
  /** Window length in milliseconds. */
  windowMs: number;
}

export async function rateLimit(opts: RateLimitOptions): Promise<void> {
  const redis = getRedis();

  // Attempt the distributed path whenever Redis is configured. If the client
  // is not yet connected or the command fails, we fall back to in-memory so
  // the request is never blocked by a Redis outage.
  if (redis) {
    const window = Math.floor(Date.now() / opts.windowMs);
    const key = `rl:${opts.key}:${window}`;
    try {
      const count = await redis.incr(key);
      if (count === 1) {
        await redis.expire(key, Math.ceil(opts.windowMs / 1000) + 1);
      }
      if (count > opts.limit) {
        throw new ApiError(429, "Too many requests. Please try again shortly.", "RATE_LIMITED");
      }
      return;
    } catch (err) {
      if (err instanceof ApiError) throw err;
      // Redis hiccup — fall through to in-memory rather than failing the request.
    }
  }

  // In-memory fallback (fixed window per key).
  const now = Date.now();
  const existing = memory.get(opts.key);

  if (!existing || existing.resetAt <= now) {
    if (memory.size >= MAX_ENTRIES) memory.clear();
    memory.set(opts.key, { count: 1, resetAt: now + opts.windowMs });
    return;
  }

  existing.count += 1;
  if (existing.count > opts.limit) {
    throw new ApiError(429, "Too many requests. Please try again shortly.", "RATE_LIMITED");
  }
}

/** Extract the best-effort client IP from a request (respects proxy headers). */
export function clientIp(req: Request): string {
  const fwd = req.headers.get("x-forwarded-for");
  if (fwd) return fwd.split(",")[0].trim();
  const real = req.headers.get("x-real-ip");
  if (real) return real.trim();
  return "unknown";
}
