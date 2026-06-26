const nasaClient = require('../config/nasaClient');
const { cacheGet, cacheSet } = require('../config/redis');
const logger = require('../utils/logger');

const MARS_TTL = parseInt(process.env.MARS_CACHE_TTL) || 3600;

const VALID_ROVERS = ['curiosity', 'opportunity', 'spirit', 'perseverance'];

const VALID_CAMERAS = {
  curiosity: ['FHAZ', 'RHAZ', 'MAST', 'CHEMCAM', 'MAHLI', 'MARDI', 'NAVCAM'],
  opportunity: ['FHAZ', 'RHAZ', 'NAVCAM', 'PANCAM', 'MINITES'],
  spirit: ['FHAZ', 'RHAZ', 'NAVCAM', 'PANCAM', 'MINITES'],
  perseverance: ['EDL_RUCAM', 'EDL_RDCAM', 'EDL_DDCAM', 'EDL_PUCAM1', 'EDL_PUCAM2',
    'NAVCAM_LEFT', 'NAVCAM_RIGHT', 'MCZ_RIGHT', 'MCZ_LEFT', 'FRONT_HAZCAM_LEFT_A',
    'FRONT_HAZCAM_RIGHT_A', 'REAR_HAZCAM_LEFT', 'REAR_HAZCAM_RIGHT', 'SKYCAM', 'SHERLOC_WATSON'],
};

/**
 * Validate and normalize Mars Rover query params.
 * Throws descriptive errors for bad inputs.
 */
const validateParams = ({ rover, sol, earth_date, camera, page = 1 }) => {
  const roverLower = (rover || 'curiosity').toLowerCase();

  if (!VALID_ROVERS.includes(roverLower)) {
    const err = new Error(`Invalid rover "${rover}". Valid options: ${VALID_ROVERS.join(', ')}`);
    err.statusCode = 400;
    throw err;
  }

  if (!sol && !earth_date) {
    const err = new Error('Provide either "sol" (Martian day) or "earth_date" (YYYY-MM-DD)');
    err.statusCode = 400;
    throw err;
  }

  if (sol !== undefined && (isNaN(Number(sol)) || Number(sol) < 0)) {
    const err = new Error('"sol" must be a non-negative integer');
    err.statusCode = 400;
    throw err;
  }

  if (camera) {
    const validCams = VALID_CAMERAS[roverLower] || [];
    if (!validCams.includes(camera.toUpperCase())) {
      const err = new Error(
        `Invalid camera "${camera}" for rover ${roverLower}. Valid: ${validCams.join(', ')}`
      );
      err.statusCode = 400;
      throw err;
    }
  }

  return { rover: roverLower, sol, earth_date, camera, page };
};

/**
 * Fetch Mars Rover photos.
 * Cache key encodes all query dimensions.
 */
const getMarsPhotos = async (queryParams) => {
  const { rover, sol, earth_date, camera, page } = validateParams(queryParams);

  const cacheKey = `mars:${rover}:sol=${sol || ''}:date=${earth_date || ''}:cam=${camera || 'all'}:page=${page}`;
  const cached = await cacheGet(cacheKey);
  if (cached) {
    logger.debug('Mars cache hit', { cacheKey });
    return cached;
  }

  const params = { page };
  if (sol !== undefined) params.sol = sol;
  if (earth_date) params.earth_date = earth_date;
  if (camera) params.camera = camera;

  logger.debug('Mars cache miss — fetching from NASA', { rover, ...params });
  const { data } = await nasaClient.get(`/mars-photos/api/v1/rovers/${rover}/photos`, { params });

  const result = {
    rover,
    total_photos: data.photos.length,
    photos: data.photos,
    query: { sol, earth_date, camera, page },
  };

  // Empty results for a valid sol are legitimate — still cache briefly (15 min)
  const ttl = data.photos.length === 0 ? 900 : MARS_TTL;
  await cacheSet(cacheKey, result, ttl);

  return result;
};

/**
 * Fetch rover manifest (metadata about a rover's mission).
 */
const getRoverManifest = async (rover) => {
  const roverLower = (rover || '').toLowerCase();
  if (!VALID_ROVERS.includes(roverLower)) {
    const err = new Error(`Invalid rover "${rover}". Valid: ${VALID_ROVERS.join(', ')}`);
    err.statusCode = 400;
    throw err;
  }

  const cacheKey = `mars:manifest:${roverLower}`;
  const cached = await cacheGet(cacheKey);
  if (cached) return cached;

  const { data } = await nasaClient.get(`/mars-photos/api/v1/manifests/${roverLower}`);
  await cacheSet(cacheKey, data.photo_manifest, 86400); // manifests change rarely
  return data.photo_manifest;
};

module.exports = { getMarsPhotos, getRoverManifest, VALID_ROVERS };
