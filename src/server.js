require('dotenv').config();
const app = require('./app');
const connectDB = require('./config/db');
const { startApodScheduler, stopApodScheduler } = require('./jobs/apodScheduler');
const logger = require('./utils/logger');

const PORT = process.env.PORT || 5000;

const start = async () => {
  try {
    // Connect to MongoDB
    await connectDB();

    // Start server
    const server = app.listen(PORT, () => {
      logger.info(`🚀 Space Explorer API running on port ${PORT}`);
      logger.info(`📖 API Docs: http://localhost:${PORT}/api-docs`);
      logger.info(`❤️  Health:   http://localhost:${PORT}/health`);
    });

    // Start background APOD scheduler
    startApodScheduler();

    // ─── Graceful Shutdown ─────────────────────────────────────────────────
    const shutdown = (signal) => {
      logger.info(`${signal} received — shutting down gracefully`);
      stopApodScheduler();
      server.close(() => {
        logger.info('HTTP server closed');
        process.exit(0);
      });
      // Force exit after 10s if connections don't close
      setTimeout(() => {
        logger.error('Forced shutdown after timeout');
        process.exit(1);
      }, 10000);
    };

    process.on('SIGTERM', () => shutdown('SIGTERM'));
    process.on('SIGINT', () => shutdown('SIGINT'));

    // Unhandled rejections
    process.on('unhandledRejection', (reason) => {
      logger.error('Unhandled Promise Rejection', { reason });
    });

  } catch (error) {
    logger.error('Failed to start server', { error: error.message });
    process.exit(1);
  }
};

start();
