const { getApod } = require('../services/apodService');
const logger = require('../utils/logger');

/**
 * GET /api/v1/apod
 * Query params: date (YYYY-MM-DD), count, thumbs
 */
const getApodHandler = async (req, res, next) => {
  try {
    const { date, count, thumbs } = req.query;
    const data = await getApod({ date, count: count ? Number(count) : undefined, thumbs });
    res.json({ success: true, data });
  } catch (error) {
    logger.error('APOD controller error', { error: error.message });
    next(error);
  }
};

module.exports = { getApodHandler };
