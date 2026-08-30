import { Redis } from "ioredis";
import env from "./envConfig.js";

let redisCacheFatalError = false;
let redisRateFatalError = false;

class MockRedis {
  private store = new Map<string, string>();
  private timers = new Map<string, ReturnType<typeof setTimeout>>();

  status = "ready";

  async get(key: string): Promise<string | null> {
    return this.store.get(key) ?? null;
  }

  async set(key: string, value: string, ..._args: any[]): Promise<"OK"> {
    const existing = this.timers.get(key);

    if (existing) {
      clearTimeout(existing);
      this.timers.delete(key);
    }

    this.store.set(key, value);

    return "OK";
  }

  async setex(key: string, seconds: number, value: string): Promise<"OK"> {
    const existing = this.timers.get(key);

    if (existing) {
      clearTimeout(existing);
      this.timers.delete(key);
    }

    this.store.set(key, value);

    const timer = setTimeout(() => {
      this.store.delete(key);
      this.timers.delete(key);
    }, seconds * 1000);

    timer.unref?.();

    this.timers.set(key, timer);

    return "OK";
  }

  async del(...keys: string[]): Promise<number> {
    let count = 0;

    for (const key of keys) {
      if (this.store.delete(key)) {
        count++;
      }

      const timer = this.timers.get(key);

      if (timer) {
        clearTimeout(timer);
        this.timers.delete(key);
      }
    }

    return count;
  }

  async keys(pattern: string): Promise<string[]> {
    const result: string[] = [];

    const prefix = pattern.endsWith("*") ? pattern.slice(0, -1) : null;

    for (const key of this.store.keys()) {
      if (prefix !== null ? key.startsWith(prefix) : key === pattern) {
        result.push(key);
      }
    }

    return result;
  }

  on(event: string, callback: (...args: any[]) => void): this {
    if (event === "connect" || event === "ready") {
      setTimeout(() => callback(), 0);
    }

    return this;
  }

  async connect(): Promise<this> {
    return this;
  }

  disconnect(): void {
    for (const timer of this.timers.values()) {
      clearTimeout(timer);
    }

    this.timers.clear();
  }

  async quit(): Promise<"OK"> {
    this.disconnect();
    return "OK";
  }
}

const mockRedis = new MockRedis();

/* -------------------------------------------------------------------------- */
/* Redis clients                                                              */
/* -------------------------------------------------------------------------- */

const redisCache = env.REDIS_URL_CACHE
  ? new Redis(env.REDIS_URL_CACHE, {
      lazyConnect: true,
      maxRetriesPerRequest: 5,
      enableReadyCheck: true,
      enableOfflineQueue: true,

      retryStrategy: (times) => {
        if (times > 3 || redisCacheFatalError) {
          redisCacheFatalError = true;

          console.warn(
            "[Redis Cache] Max retries reached — Redis disabled, falling back to in-memory MockRedis.",
          );

          return null;
        }

        return Math.min(times * 200, 2000);
      },
    })
  : null;

const redisRate = env.REDIS_URL_RATELIMIT
  ? new Redis(env.REDIS_URL_RATELIMIT, {
      lazyConnect: true,
      maxRetriesPerRequest: 5,
      enableReadyCheck: true,
      enableOfflineQueue: true,

      retryStrategy: (times) => {
        if (times > 3 || redisRateFatalError) {
          redisRateFatalError = true;

          console.warn(
            "[Redis Rate Limit] Max retries reached — Redis disabled, falling back to in-memory MockRedis.",
          );

          return null;
        }

        return Math.min(times * 200, 2000);
      },
    })
  : null;

/* -------------------------------------------------------------------------- */
/* Redis error handling                                                       */
/* -------------------------------------------------------------------------- */

const isFatalRedisError = (error: unknown): boolean => {
  const message = error instanceof Error ? error.message : String(error);

  return (
    message.includes("NOAUTH") ||
    message.includes("WRONGPASS") ||
    message.includes("ERR invalid password") ||
    message.includes("ECONNREFUSED")
  );
};

if (redisCache) {
  redisCache.on("error", (error: unknown) => {
    if (!isFatalRedisError(error)) {
      return;
    }

    if (!redisCacheFatalError) {
      redisCacheFatalError = true;

      console.warn(
        "[Redis Cache] Authentication/connection failure — Redis disabled, falling back to in-memory MockRedis.",
      );

      redisCache.disconnect();
    }
  });

  redisCache.on("ready", () => {
    if (!redisCacheFatalError) {
      console.log("[Redis Cache] connected and ready");
    }
  });
}

if (redisRate) {
  redisRate.on("error", (error: unknown) => {
    if (!isFatalRedisError(error)) {
      return;
    }

    if (!redisRateFatalError) {
      redisRateFatalError = true;

      console.warn(
        "[Redis Rate Limit] Authentication/connection failure — Redis disabled, falling back to in-memory MockRedis.",
      );

      redisRate.disconnect();
    }
  });

  redisRate.on("ready", () => {
    if (!redisRateFatalError) {
      console.log("[Redis Rate Limit] connected and ready");
    }
  });
}

/* -------------------------------------------------------------------------- */
/* Cache proxy                                                                */
/* -------------------------------------------------------------------------- */

const cache = new Proxy({} as Redis, {
  get(_target, prop: string | symbol) {
    const useMock = redisCacheFatalError || !redisCache;

    const activeClient = useMock ? mockRedis : redisCache;

    if (prop === "status") {
      return activeClient.status;
    }

    const value = (activeClient as any)[prop];

    if (typeof value === "function") {
      return (...args: any[]) => {
        try {
          return value.apply(activeClient, args);
        } catch (error) {
          if (!useMock) {
            redisCacheFatalError = true;

            console.warn(
              "[Redis Cache] Error during execution, falling back to MockRedis:",
              error,
            );

            const fallback = (mockRedis as any)[prop];

            if (typeof fallback === "function") {
              return fallback.apply(mockRedis, args);
            }
          }

          throw error;
        }
      };
    }

    return value;
  },
});

/* -------------------------------------------------------------------------- */
/* Rate-limit proxy                                                           */
/* -------------------------------------------------------------------------- */

const rateLimit = new Proxy({} as Redis, {
  get(_target, prop: string | symbol) {
    const useMock = redisRateFatalError || !redisRate;

    const activeClient = useMock ? mockRedis : redisRate;

    if (prop === "status") {
      return activeClient.status;
    }

    const value = (activeClient as any)[prop];

    if (typeof value === "function") {
      return (...args: any[]) => {
        try {
          return value.apply(activeClient, args);
        } catch (error) {
          if (!useMock) {
            redisRateFatalError = true;

            console.warn(
              "[Redis Rate Limit] Error during execution, falling back to MockRedis:",
              error,
            );

            const fallback = (mockRedis as any)[prop];

            if (typeof fallback === "function") {
              return fallback.apply(mockRedis, args);
            }
          }

          throw error;
        }
      };
    }

    return value;
  },
});

/* -------------------------------------------------------------------------- */
/* Connection helpers                                                         */
/* -------------------------------------------------------------------------- */

export async function connectRedisCache(): Promise<Redis> {
  if (!redisCache) {
    return cache;
  }

  if (redisCacheFatalError) {
    return cache;
  }

  try {
    await redisCache.connect();
    return cache;
  } catch (error) {
    redisCacheFatalError = true;

    console.warn(
      "[Redis Cache] unavailable, falling back to in-memory MockRedis:",
      error instanceof Error ? error.message : error,
    );

    redisCache.disconnect();

    return cache;
  }
}

export async function connectRedisRateLimit(): Promise<Redis> {
  if (!redisRate) {
    return rateLimit;
  }

  if (redisRateFatalError) {
    return rateLimit;
  }

  try {
    await redisRate.connect();
    return rateLimit;
  } catch (error) {
    redisRateFatalError = true;

    console.warn(
      "[Redis Rate Limit] unavailable, falling back to in-memory MockRedis:",
      error instanceof Error ? error.message : error,
    );

    redisRate.disconnect();

    return rateLimit;
  }
}

/* -------------------------------------------------------------------------- */
/* Exports                                                                    */
/* -------------------------------------------------------------------------- */

// Default Redis client used for application caching.
export default { cache, rateLimit };

// Named rate-limit Redis client.
export { rateLimit, cache };

/* -------------------------------------------------------------------------- */
/* Cache-aside helper                                                         */
/* -------------------------------------------------------------------------- */

/**
 * Fetch data using a cache-aside pattern.
 *
 * 1. Try Redis.
 * 2. If cached, deserialize and return it.
 * 3. Otherwise execute fetcher().
 * 4. Cache the result.
 * 5. Return the result.
 */
export async function fetchWithCache<T>(
  key: string,
  ttlSeconds: number,
  fetcher: () => Promise<T>,
): Promise<T> {
  try {
    const cached = await cache.get(key);

    if (cached !== null) {
      try {
        return JSON.parse(cached) as T;
      } catch (error) {
        console.warn(
          `[Redis Cache] Invalid JSON for key ${key}, ignoring cached value:`,
          error,
        );

        await cache.del(key).catch(() => {});
      }
    }
  } catch (error) {
    console.warn(`[Redis Cache] Failed to get ${key}:`, error);
  }

  const data = await fetcher();

  if (data !== undefined && data !== null) {
    try {
      await cache.setex(key, ttlSeconds, JSON.stringify(data));
    } catch (error) {
      console.warn(`[Redis Cache] Failed to set ${key}:`, error);
    }
  }

  return data;
}
