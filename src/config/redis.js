const Redis = require('ioredis');
const logger = require('../utils/logger');

let client = null;

const getRedisClient = () => {
  if (client) return client;

  client = new Redis(process.env.REDIS_URL || 'redis://localhost:6379', {
    maxRetriesPerRequest: 3,
    lazyConnect: true,
    connectTimeout: 5000,
  });

  client.on('connect', () => logger.info('Redis connected'));
  client.on('error', (err) => {
    logger.warn('Redis error — falling back to no cache', { error: err.message });
    client = null; // allow graceful fallback
  });

  return client;
};

/**
 * Get a value from Redis. Returns null on miss or error.
 */
const cacheGet = async (key) => {
  try {
    const redis = getRedisClient();
    if (!redis) return null;
    const data = await redis.get(key);
    return data ? JSON.parse(data) : null;
  } catch {
    return null;
  }
};

/**
 * Set a value in Redis with TTL (seconds).
 */
const cacheSet = async (key, value, ttl) => {
  try {
    const redis = getRedisClient();
    if (!redis) return;
    await redis.set(key, JSON.stringify(value), 'EX', ttl);
  } catch {
    // silent — cache is best-effort
  }
};

/**
 * Delete a key from Redis.
 */
const cacheDel = async (key) => {
  try {
    const redis = getRedisClient();
    if (!redis) return;
    await redis.del(key);
  } catch {
    // silent
  }
};

module.exports = { getRedisClient, cacheGet, cacheSet, cacheDel };
