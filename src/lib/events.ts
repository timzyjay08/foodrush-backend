import type { Order } from "@/db/schema";
import { getRedis } from "./redis";

/**
 * Publish/subscribe event bus for real-time updates (Server-Sent Events).
 *
 * Load-balancing fix: the bus is no longer limited to a single process.
 *
 *   - Local delivery always works (single-instance mode).
 *   - When REDIS_URL is configured, messages are also broadcast over Redis
 *     pub/sub so a client connected to backend instance A still receives
 *     events published on instance B behind the load balancer.
 *
 * A per-instance id prevents double delivery when a message is both delivered
 * locally and echoed back over Redis on the same instance.
 */

type Listener = (data: unknown) => void;

const INSTANCE_ID =
  Math.random().toString(36).slice(2, 10) + Date.now().toString(36);

const localListeners = new Map<string, Set<Listener>>();

// A single shared Redis subscriber connection, reused across requests.
let redisSubscriber: ReturnType<typeof getRedis> | null = null;
const redisRefCounts = new Map<string, number>();

function getSubscriber() {
  const redis = getRedis();
  if (!redis) return null;
  if (!redisSubscriber) {
    redisSubscriber = redis.duplicate();
    redisSubscriber.on("message", (channel, message) => {
      try {
        const parsed = JSON.parse(message) as { __from?: string; data?: unknown };
        // Skip messages that originated on this instance — they were already
        // delivered locally, so we must not deliver them twice.
        if (parsed.__from === INSTANCE_ID) return;
        deliverLocally(channel, parsed.data);
      } catch {
        /* ignore malformed frames */
      }
    });
  }
  return redisSubscriber;
}

function deliverLocally(key: string, data: unknown): void {
  const set = localListeners.get(key);
  if (!set) return;
  for (const fn of Array.from(set)) {
    try {
      fn(data);
    } catch (err) {
      console.error("[events] listener error", err);
    }
  }
}

export function subscribe(key: string, fn: Listener): () => void {
  // 1) Register locally (always).
  if (!localListeners.has(key)) localListeners.set(key, new Set());
  const set = localListeners.get(key)!;
  set.add(fn);

  // 2) Subscribe on Redis for cross-instance fan-out (best-effort).
  const sub = getSubscriber();
  if (sub) {
    const count = redisRefCounts.get(key) ?? 0;
    if (count === 0) {
      sub.subscribe(key).catch(() => {});
    }
    redisRefCounts.set(key, count + 1);
  }

  return () => {
    set.delete(fn);
    if (set.size === 0) localListeners.delete(key);
    if (sub) {
      const count = redisRefCounts.get(key) ?? 0;
      if (count <= 1) {
        sub.unsubscribe(key).catch(() => {});
        redisRefCounts.delete(key);
      } else {
        redisRefCounts.set(key, count - 1);
      }
    }
  };
}

export function publish(key: string, data: unknown): void {
  // Local delivery.
  deliverLocally(key, data);

  // Cross-instance delivery via Redis (best-effort, fire-and-forget).
  const redis = getRedis();
  if (redis) {
    redis.publish(key, JSON.stringify({ __from: INSTANCE_ID, data })).catch(() => {});
  }
}

export function orderChannel(orderId: number): string {
  return `order:${orderId}`;
}

export function userChannel(userId: number): string {
  return `user:${userId}`;
}

export function driverLocationChannel(userId: number): string {
  return `driver-location:${userId}`;
}

/** Publish an order update to every interested channel. */
export function publishOrderUpdate(order: Order): void {
  publish(orderChannel(order.id), order);
  publish(userChannel(order.userId), order);
  if (order.riderId) publish(userChannel(order.riderId), order);
}

export interface DriverLocationEvent {
  driverId: number;
  orderId: number | null;
  latitude: number;
  longitude: number;
  updatedAt: string;
}

/** Publish a driver's location to the customer tracking their active order. */
export function publishDriverLocation(customerUserId: number, event: DriverLocationEvent): void {
  publish(driverLocationChannel(customerUserId), event);
}
