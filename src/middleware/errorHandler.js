const logger = require('../utils/logger');

const errorHandler = (error, req, res, next) => {
  logger.error('Unhandled error', {
    error: error.message,
    stack: error.stack,
    url: req.url,
    method: req.method,
    body: req.body,
    headers: req.headers
  });

  // Default error response
  let status = 500;
  let message = 'Internal Server Error';

  // Handle specific error types
  if (error.name === 'ValidationError') {
    status = 400;
    message = 'Validation Error';
  } else if (error.name === 'UnauthorizedError') {
    status = 401;
    message = 'Unauthorized';
  } else if (error.code === 'ECONNREFUSED') {
    status = 503;
    message = 'Service Unavailable';
  }

  res.status(status).json({
    error: message,
    ...(process.env.NODE_ENV === 'development' && {
      details: error.message,
      stack: error.stack
    })
  });
};

module.exports = errorHandler;