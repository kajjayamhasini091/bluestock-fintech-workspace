const Redis = require("ioredis");

let redis = null;

if (process.env.REDIS_URL) {
  redis = new Redis(process.env.REDIS_URL, {
    maxRetriesPerRequest: 1,
    lazyConnect: true,
  });

  redis.on("error", (err) => {
    console.warn("[Redis] Connection error — caching disabled:", err.message);
    redis = null;
  });

  redis.on("connect", () => {
    console.log("[Redis] Connected");
  });
}

/**
 * Get a cached value. Returns null if Redis is unavailable.
 */
async function getCache(key) {
  if (!redis) return null;
  try {
    const val = await redis.get(key);
    return val ? JSON.parse(val) : null;
  } catch {
    return null;
  }
}

/**
 * Set a cached value with optional TTL in seconds (default: 1 hour).
 */
async function setCache(key, value, ttlSeconds = 3600) {
  if (!redis) return;
  try {
    await redis.set(key, JSON.stringify(value), "EX", ttlSeconds);
  } catch {
    // Silently fail — cache is best-effort
  }
}

/**
 * Delete a cached key.
 */
async function delCache(key) {
  if (!redis) return;
  try {
    await redis.del(key);
  } catch {}
}

module.exports = { getCache, setCache, delCache };
