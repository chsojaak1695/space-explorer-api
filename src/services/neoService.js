const nasaClient = require('../config/nasaClient');
const { cacheGet, cacheSet } = require('../config/redis');
const logger = require('../utils/logger');

const NEO_TTL = parseInt(process.env.NEO_CACHE_TTL) || 3600;
const MAX_DATE_RANGE_DAYS = 7; // NASA enforces this hard limit

/**
 * Parse and validate a YYYY-MM-DD string.
 */
const parseDate = (str, label) => {
  const d = new Date(str);
  if (isNaN(d.getTime()) || !/^\d{4}-\d{2}-\d{2}$/.test(str)) {
    const err = new Error(`Invalid ${label}: "${str}". Use format YYYY-MM-DD`);
    err.statusCode = 400;
    throw err;
  }
  return d;
};

/**
 * Fetch NEO feed for a date range.
 * NASA enforces a max 7-day window — we validate this before hitting their API.
 */
const getNeoFeed = async ({ start_date, end_date, min_diameter, max_diameter } = {}) => {
  const today = new Date().toISOString().split('T')[0];
  const startDate = start_date || today;
  const endDate = end_date || today;

  const start = parseDate(startDate, 'start_date');
  const end = parseDate(endDate, 'end_date');

  if (end < start) {
    const err = new Error('"end_date" must be on or after "start_date"');
    err.statusCode = 400;
    throw err;
  }

  const diffDays = Math.ceil((end - start) / (1000 * 60 * 60 * 24));
  if (diffDays > MAX_DATE_RANGE_DAYS) {
    const err = new Error(
      `Date range of ${diffDays} days exceeds NASA's maximum of ${MAX_DATE_RANGE_DAYS} days. ` +
      `Please narrow your range.`
    );
    err.statusCode = 400;
    throw err;
  }

  const futureDate = new Date();
  futureDate.setDate(futureDate.getDate() + 365); // NASA allows up to ~1yr future
  if (start > futureDate) {
    const err = new Error(`"start_date" is too far in the future`);
    err.statusCode = 400;
    throw err;
  }

  const cacheKey = `neo:feed:${startDate}:${endDate}`;
  const cached = await cacheGet(cacheKey);
  if (cached) {
    logger.debug('NEO feed cache hit', { startDate, endDate });
    return applyFilters(cached, { min_diameter, max_diameter });
  }

  logger.debug('NEO feed cache miss — fetching from NASA', { startDate, endDate });
  const { data } = await nasaClient.get('/neo/rest/v1/feed', {
    params: { start_date: startDate, end_date: endDate },
  });

  const normalized = normalizeNeoFeed(data);
  await cacheSet(cacheKey, normalized, NEO_TTL);

  return applyFilters(normalized, { min_diameter, max_diameter });
};

/**
 * Fetch a specific NEO by its NASA ID.
 */
const getNeoById = async (asteroidId) => {
  if (!asteroidId || !/^\d+$/.test(asteroidId)) {
    const err = new Error('Invalid asteroid ID — must be a numeric string');
    err.statusCode = 400;
    throw err;
  }

  const cacheKey = `neo:id:${asteroidId}`;
  const cached = await cacheGet(cacheKey);
  if (cached) return cached;

  const { data } = await nasaClient.get(`/neo/rest/v1/neo/${asteroidId}`);
  await cacheSet(cacheKey, data, NEO_TTL * 24); // asteroid data is stable
  return data;
};

/**
 * Flatten NASA's date-keyed structure into a sorted array.
 */
const normalizeNeoFeed = (data) => {
  const objects = Object.entries(data.near_earth_objects).flatMap(([date, neos]) =>
    neos.map((neo) => ({
      id: neo.id,
      name: neo.name,
      date,
      nasa_jpl_url: neo.nasa_jpl_url,
      is_potentially_hazardous: neo.is_potentially_hazardous_asteroid,
      estimated_diameter_km: {
        min: neo.estimated_diameter?.kilometers?.estimated_diameter_min,
        max: neo.estimated_diameter?.kilometers?.estimated_diameter_max,
      },
      close_approach: neo.close_approach_data?.[0] || null,
      absolute_magnitude_h: neo.absolute_magnitude_h,
    }))
  );

  objects.sort((a, b) => new Date(a.date) - new Date(b.date));

  return {
    element_count: data.element_count,
    date_range: {
      start: data.links?.self?.match(/start_date=([^&]+)/)?.[1] || null,
      end: data.links?.self?.match(/end_date=([^&]+)/)?.[1] || null,
    },
    near_earth_objects: objects,
  };
};

/**
 * Apply optional diameter filters (post-cache, in-memory).
 */
const applyFilters = (data, { min_diameter, max_diameter }) => {
  let objects = data.near_earth_objects;

  if (min_diameter !== undefined) {
    objects = objects.filter(
      (o) => (o.estimated_diameter_km?.min || 0) >= parseFloat(min_diameter)
    );
  }
  if (max_diameter !== undefined) {
    objects = objects.filter(
      (o) => (o.estimated_diameter_km?.max || Infinity) <= parseFloat(max_diameter)
    );
  }

  return { ...data, near_earth_objects: objects, filtered_count: objects.length };
};

module.exports = { getNeoFeed, getNeoById };
