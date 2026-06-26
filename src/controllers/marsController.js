const { getMarsPhotos, getRoverManifest } = require('../services/marsService');
const logger = require('../utils/logger');

/**
 * GET /api/v1/mars/photos
 * Query params: rover, sol, earth_date, camera, page
 */
const getMarsPhotosHandler = async (req, res, next) => {
  try {
    const data = await getMarsPhotos(req.query);
    res.json({ success: true, data });
  } catch (error) {
    logger.error('Mars photos controller error', { error: error.message });
    next(error);
  }
};

/**
 * GET /api/v1/mars/manifests/:rover
 */
const getRoverManifestHandler = async (req, res, next) => {
  try {
    const data = await getRoverManifest(req.params.rover);
    res.json({ success: true, data });
  } catch (error) {
    logger.error('Mars manifest controller error', { error: error.message });
    next(error);
  }
};

module.exports = { getMarsPhotosHandler, getRoverManifestHandler };
