/**
 * @description Centralized logging utilities with consistent formatting and levels
 * Based on existing Winston logger patterns in the codebase
 */

import winston from 'winston';
import type { LogLevel, LoggerConfig } from '@shared/types';

/**
 * Default logger configuration
 */
const DEFAULT_CONFIG: LoggerConfig = {
  level: 'info',
  dir: './logs',
  enableConsole: true,
  enableFile: process.env.NODE_ENV === 'production',
};

/**
 * @description Creates a Winston logger instance with standardized configuration
 * @param config - Logger configuration options
 * @returns Configured Winston logger instance
 */
export function createLogger(
  config: Partial<LoggerConfig> = {}
): winston.Logger {
  const finalConfig = { ...DEFAULT_CONFIG, ...config };

  const logger = winston.createLogger({
    level: finalConfig.level,
    format: winston.format.combine(
      winston.format.timestamp(),
      winston.format.errors({ stack: true }),
      winston.format.json()
    ),
    defaultMeta: {
      service: process.env.SERVICE_NAME || 'unknown-service',
      environment: process.env.NODE_ENV || 'development',
    },
    transports: [],
  });

  // Add console transport if enabled
  if (finalConfig.enableConsole) {
    logger.add(
      new winston.transports.Console({
        format: winston.format.combine(
          winston.format.colorize(),
          winston.format.simple()
        ),
      })
    );
  }

  // Add file transports if enabled
  if (finalConfig.enableFile) {
    logger.add(
      new winston.transports.File({
        filename: `${finalConfig.dir}/error.log`,
        level: 'error',
      })
    );
    logger.add(
      new winston.transports.File({
        filename: `${finalConfig.dir}/combined.log`,
      })
    );
  }

  return logger;
}

/**
 * Default logger instance for the application
 */
export const logger = createLogger();

/**
 * @description Logs API request information with consistent format
 * @param method - HTTP method
 * @param path - Request path
 * @param ip - Client IP address
 * @param duration - Request duration in milliseconds
 */
export function logRequest(
  method: string,
  path: string,
  ip: string,
  duration?: number
): void {
  const message = `${method} ${path} - ${ip}`;
  const meta = {
    method,
    path,
    ip,
    ...(duration && { duration: `${duration}ms` }),
  };

  logger.info(message, meta);
}

/**
 * @description Logs error information with stack trace and context
 * @param error - Error object or message
 * @param context - Additional context information
 */
export function logError(
  error: Error | string,
  context: Record<string, any> = {}
): void {
  const message = error instanceof Error ? error.message : error;
  const meta = {
    ...context,
    ...(error instanceof Error && {
      stack: error.stack,
      name: error.name,
    }),
  };

  logger.error(message, meta);
}

/**
 * @description Creates a child logger with additional metadata
 * @param metadata - Additional metadata to include in all logs
 * @returns Child logger instance
 */
export function createChildLogger(
  metadata: Record<string, any>
): winston.Logger {
  return logger.child(metadata);
}

/**
 * Log level utilities
 */
export const LOG_LEVELS: Record<LogLevel, number> = {
  debug: 0,
  info: 1,
  warn: 2,
  error: 3,
};

/**
 * @description Checks if a log level should be logged based on current configuration
 * @param level - Log level to check
 * @returns True if the level should be logged
 */
export function shouldLog(level: LogLevel): boolean {
  const currentLevel = (logger.level as LogLevel) || 'info';
  return LOG_LEVELS[level] >= LOG_LEVELS[currentLevel];
}
