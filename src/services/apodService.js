const nasaClient = require('../config/nasaClient');
const { cacheGet, cacheSet } = require('../config/redis');
const ApodCache = require('../models/ApodCache');
const logger = require('../utils/logger');

const APOD_TTL = parseInt(process.env.APOD_CACHE_TTL) || 86400;

/**
 * Fetch Astronomy Picture of the Day.
 * Priority: Redis → MongoDB → NASA API
 */
const getApod = async ({ date, count, thumbs } = {}) => {
  // Bulk/random requests (count param) bypass cache
  if (count) {
    const { data } = await nasaClient.get('/planetary/apod', {
      params: { count, thumbs },
    });
    return data;
  }

  const targetDate = date || new Date().toISOString().split('T')[0];

  // 1. Redis cache
  const cacheKey = `apod:${targetDate}`;
  const cached = await cacheGet(cacheKey);
  if (cached) {
    logger.debug('APOD cache hit (Redis)', { date: targetDate });
    return cached;
  }

  // 2. MongoDB persistent cache
  const dbCached = await ApodCache.findOne({ date: targetDate });
  if (dbCached) {
    logger.debug('APOD cache hit (MongoDB)', { date: targetDate });
    await cacheSet(cacheKey, dbCached.rawPayload, APOD_TTL);
    return dbCached.rawPayload;
  }

  // 3. NASA API
  logger.debug('APOD cache miss — fetching from NASA', { date: targetDate });
  const { data } = await nasaClient.get('/planetary/apod', {
    params: { date: targetDate, thumbs },
  });

  // Persist to Redis and MongoDB
  await cacheSet(cacheKey, data, APOD_TTL);
  await ApodCache.findOneAndUpdate(
    { date: targetDate },
    { date: targetDate, ...data, rawPayload: data },
    { upsert: true, new: true }
  );

  return data;
};

module.exports = { getApod };
