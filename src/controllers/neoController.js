const { getNeoFeed, getNeoById } = require('../services/neoService');
const logger = require('../utils/logger');

/**
 * GET /api/v1/neo/feed
 * Query params: start_date, end_date, min_diameter, max_diameter
 */
const getNeoFeedHandler = async (req, res, next) => {
  try {
    const data = await getNeoFeed(req.query);
    res.json({ success: true, data });
  } catch (error) {
    logger.error('NEO feed controller error', { error: error.message });
    next(error);
  }
};

/**
 * GET /api/v1/neo/:asteroidId
 */
const getNeoByIdHandler = async (req, res, next) => {
  try {
    const data = await getNeoById(req.params.asteroidId);
    res.json({ success: true, data });
  } catch (error) {
    logger.error('NEO by ID controller error', { error: error.message });
    next(error);
  }
};

module.exports = { getNeoFeedHandler, getNeoByIdHandler };
