import "server-only";

/**
 * Fixed-window rate limiter kept in process memory. Suitable for a single Node process.
 * For multi-instance deployments, swap the store for Redis without changing callers.
 */

interface Bucket {
  count: number;
  resetAt: number;
}

interface RateLimitOptions {
  limit: number;
  windowMs: number;
}

export interface RateLimitResult {
  allowed: boolean;
  remaining: number;
  retryAfterSeconds: number;
}

const globalForRateLimit = globalThis as typeof globalThis & {
  __genspaRateLimitStore?: Map<string, Bucket>;
};

const store = globalForRateLimit.__genspaRateLimitStore ?? new Map<string, Bucket>();
globalForRateLimit.__genspaRateLimitStore = store;

export function consumeRateLimit(key: string, options: RateLimitOptions, now = Date.now()): RateLimitResult {
  if (store.size > 5000) {
    for (const [storedKey, bucket] of store) {
      if (bucket.resetAt <= now) {
        store.delete(storedKey);
      }
    }
  }

  const bucket = store.get(key);
  if (!bucket || bucket.resetAt <= now) {
    store.set(key, { count: 1, resetAt: now + options.windowMs });
    return { allowed: true, remaining: options.limit - 1, retryAfterSeconds: 0 };
  }

  if (bucket.count >= options.limit) {
    return {
      allowed: false,
      remaining: 0,
      retryAfterSeconds: Math.ceil((bucket.resetAt - now) / 1000),
    };
  }

  bucket.count += 1;
  return { allowed: true, remaining: options.limit - bucket.count, retryAfterSeconds: 0 };
}
