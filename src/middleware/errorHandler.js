const logger = require('../utils/logger');

/**
 * Central error handling middleware.
 * Normalizes errors from services, Mongoose, and NASA API into consistent responses.
 */
const errorHandler = (err, req, res, _next) => {
  logger.error('Unhandled error', {
    message: err.message,
    stack: process.env.NODE_ENV === 'development' ? err.stack : undefined,
    path: req.path,
    method: req.method,
  });

  // Our own domain errors (thrown with statusCode)
  if (err.statusCode) {
    return res.status(err.statusCode).json({
      success: false,
      error: err.message,
    });
  }

  // Mongoose validation errors
  if (err.name === 'ValidationError') {
    const messages = Object.values(err.errors).map((e) => e.message);
    return res.status(400).json({
      success: false,
      error: 'Validation failed',
      details: messages,
    });
  }

  // Mongoose duplicate key
  if (err.code === 11000) {
    return res.status(409).json({
      success: false,
      error: 'This item already exists in your favorites',
    });
  }

  // Mongoose bad ObjectId
  if (err.name === 'CastError' && err.kind === 'ObjectId') {
    return res.status(400).json({
      success: false,
      error: 'Invalid ID format',
    });
  }

  // Default 500
  res.status(500).json({
    success: false,
    error: 'Internal server error',
  });
};

module.exports = errorHandler;
