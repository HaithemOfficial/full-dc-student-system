const { createLogger, format, transports } = require('winston');
require('winston-daily-rotate-file');

const isProd = process.env.NODE_ENV === 'production';

const sanitizeMessage = format((info) => {
  // Never log passwords or tokens
  if (typeof info.message === 'string') {
    info.message = info.message
      .replace(/"password"\s*:\s*"[^"]*"/gi, '"password":"[REDACTED]"')
      .replace(/Bearer\s+[A-Za-z0-9._-]+/g, 'Bearer [REDACTED]');
  }
  return info;
});

const logger = createLogger({
  level: isProd ? 'info' : 'debug',
  format: format.combine(
    sanitizeMessage(),
    format.timestamp(),
    format.errors({ stack: true }),
    isProd ? format.json() : format.combine(format.colorize(), format.simple())
  ),
  transports: isProd
    ? [
        new transports.DailyRotateFile({
          filename: 'logs/app-%DATE%.log',
          datePattern: 'YYYY-MM-DD',
          maxFiles: '30d',
          level: 'info',
        }),
        new transports.DailyRotateFile({
          filename: 'logs/error-%DATE%.log',
          datePattern: 'YYYY-MM-DD',
          maxFiles: '30d',
          level: 'error',
        }),
        new transports.Console({ level: 'warn' }),
      ]
    : [new transports.Console()],
});

// Security event helpers
logger.security = (event, meta = {}) => logger.info(`[SECURITY] ${event}`, meta);
logger.authFail  = (reason, meta = {}) => logger.warn(`[AUTH_FAIL] ${reason}`, meta);

module.exports = logger;
