const cron = require('node-cron');
const { getApod } = require('../services/apodService');
const logger = require('../utils/logger');

let scheduledTask = null;

/**
 * Fetch and cache today's APOD.
 * Called by the scheduler and also on startup to pre-warm the cache.
 */
const fetchTodayApod = async () => {
  const today = new Date().toISOString().split('T')[0];
  logger.info(`[APOD Scheduler] Fetching APOD for ${today}`);
  try {
    const data = await getApod({ date: today });
    logger.info(`[APOD Scheduler] Successfully cached: "${data.title}"`, { date: today });
    return data;
  } catch (error) {
    // Do not crash the scheduler on error — NASA API may be momentarily unavailable
    logger.error('[APOD Scheduler] Failed to fetch APOD', {
      date: today,
      error: error.message,
    });
  }
};

/**
 * Start the daily APOD background job.
 * Runs at 00:05 UTC every day to give NASA time to publish before we pull.
 * Also pre-warms the cache immediately on startup.
 */
const startApodScheduler = () => {
  // Pre-warm on startup (fire and forget)
  fetchTodayApod();

  // Schedule: 00:05 UTC daily
  scheduledTask = cron.schedule('5 0 * * *', fetchTodayApod, {
    timezone: 'UTC',
    runOnInit: false, // we handle init above
  });

  logger.info('[APOD Scheduler] Started — runs daily at 00:05 UTC');
};

/**
 * Stop the scheduler gracefully (called on server shutdown).
 * If the server restarts mid-run, the next startup pre-warm handles recovery.
 */
const stopApodScheduler = () => {
  if (scheduledTask) {
    scheduledTask.stop();
    logger.info('[APOD Scheduler] Stopped');
  }
};

module.exports = { startApodScheduler, stopApodScheduler, fetchTodayApod };
