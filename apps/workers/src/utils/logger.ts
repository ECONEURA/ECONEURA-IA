/**
 * Logger - Winston logging configuration
 * ECONEURA WORKERS OUTLOOK - Logging Utility
 */

import winston from 'winston';
import path from 'path';

// Define log levels
const logLevels = {
  error: 0,
  warn: 1,
  info: 2,
  http: 3,
  debug: 4
};

// Define log colors
const logColors = {
  error: 'red',
  warn: 'yellow',
  info: 'green',
  http: 'magenta',
  debug: 'white'
};

// Add colors to winston
winston.addColors(logColors);

// Create log format
const logFormat = winston.format.combine(
  winston.format.timestamp({ format: 'YYYY-MM-DD HH:mm:ss:ms' }),
  winston.format.colorize({ all: true }),
  winston.format.printf(
    (info) => `${info.timestamp} ${info.level}: ${info.message}` +
    (info.splat !== undefined ? `${info.splat}` : " ") +
    (info.label ? `[${info.label}]` : "") +
    (info.metadata ? ` ${JSON.stringify(info.metadata)}` : "")
  )
);

// Create production format (no colors, structured JSON)
const productionFormat = winston.format.combine(
  winston.format.timestamp(),
  winston.format.errors({ stack: true }),
  winston.format.json()
);

// Determine if we're in production
const isProduction = process.env.NODE_ENV === 'production';

// Create transports array
const transports = [
  // Console transport
  new winston.transports.Console({
    format: isProduction ? productionFormat : logFormat
  }),
  
  // File transport for errors
  new winston.transports.File({
    filename: path.join(process.cwd(), 'logs', 'error.log'),
    level: 'error',
    format: productionFormat,
    maxsize: 5242880, // 5MB
    maxFiles: 5
  }),
  
  // File transport for all logs
  new winston.transports.File({
    filename: path.join(process.cwd(), 'logs', 'combined.log'),
    format: productionFormat,
    maxsize: 5242880, // 5MB
    maxFiles: 5
  })
];

// Create logger instance
export const logger = winston.createLogger({
  level: isProduction ? 'info' : 'debug',
  levels: logLevels,
  format: productionFormat,
  transports,
  exitOnError: false
});

// Create a stream for Morgan HTTP logging
export const loggerStream = {
  write: (message: string) => {
    logger.http(message.trim());
  }
};

// Export individual log methods for convenience
export const logError = (message: string, metadata?: any) => {
  logger.error(message, metadata);
};

export const logWarn = (message: string, metadata?: any) => {
  logger.warn(message, metadata);
};

export const logInfo = (message: string, metadata?: any) => {
  logger.info(message, metadata);
};

export const logDebug = (message: string, metadata?: any) => {
  logger.debug(message, metadata);
};

// Create child logger for specific modules
export const createModuleLogger = (module: string) => {
  return logger.child({ module });
};

// Create structured logging helpers
export const logJobStart = (jobId: string, type: string, metadata?: any) => {
  logger.info(`Job started: ${type}`, { jobId, type, ...metadata });
};

export const logJobComplete = (jobId: string, type: string, duration: number, metadata?: any) => {
  logger.info(`Job completed: ${type}`, { jobId, type, duration, ...metadata });
};

export const logJobError = (jobId: string, type: string, error: Error, metadata?: any) => {
  logger.error(`Job failed: ${type}`, { jobId, type, error: error.message, stack: error.stack, ...metadata });
};

export const logApiRequest = (method: string, url: string, statusCode: number, duration: number, metadata?: any) => {
  logger.http(`${method} ${url}`, { method, url, statusCode, duration, ...metadata });
};

export const logMetric = (metric: string, value: number, labels?: Record<string, string>) => {
  logger.info(`Metric: ${metric}`, { metric, value, labels });
};

// Ensure logs directory exists
import fs from 'fs';
const logsDir = path.join(process.cwd(), 'logs');
if (!fs.existsSync(logsDir)) {
  fs.mkdirSync(logsDir, { recursive: true });
}
