const winston = require('winston');

// Winston logger configuration
const logger = winston.createLogger({
  level: process.env.LOG_LEVEL || 'info',
  format: winston.format.combine(
    winston.format.timestamp(),
    winston.format.errors({ stack: true }),
    winston.format.json()
  ),
  transports: [
    new winston.transports.Console({
      format: winston.format.combine(
        winston.format.colorize(),
        winston.format.simple()
      )
    }),
    new winston.transports.File({ filename: 'logs/combined.log' }),
    new winston.transports.File({ filename: 'logs/error.log', level: 'error' })
  ]
});

/**
 * Logging Middleware
 * Logs HTTP requests and responses
 */

const loggingMiddleware = (req, res, next) => {
  const start = Date.now();

  // Log request
  logger.info('Incoming request', {
    method: req.method,
    path: req.path,
    ip: req.ip,
    userAgent: req.headers['user-agent']
  });

  // Log response
  res.on('finish', () => {
    const duration = Date.now() - start;
    logger.info('Request completed', {
      method: req.method,
      path: req.path,
      statusCode: res.statusCode,
      duration: `${duration}ms`,
      ip: req.ip
    });
  });

  next();
};

/**
 * Error Logging Helper
 */

const logError = (error, context = {}) => {
  logger.error(error.message, {
    stack: error.stack,
    ...context
  });
};

/**
 * Info Logging Helper
 */

const logInfo = (message, context = {}) => {
  logger.info(message, context);
};

/**
 * Debug Logging Helper
 */

const logDebug = (message, context = {}) => {
  logger.debug(message, context);
};

module.exports = loggingMiddleware;
module.exports.logError = logError;
module.exports.logInfo = logInfo;
module.exports.logDebug = logDebug;