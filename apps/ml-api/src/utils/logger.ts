// [DEPRECATED: 2025-08-11] Local logger implementation preserved for reference
// This logger has been replaced with the shared logger from @shared/utils
// All imports should now use: import { logger } from '@shared/utils';

/*
import winston from "winston";

const logger = winston.createLogger({
  level: process.env.LOG_LEVEL || "info",
  format: winston.format.combine(
    winston.format.timestamp(),
    winston.format.errors({ stack: true }),
    winston.format.json()
  ),
  defaultMeta: { service: "ml-face-score-api" },
  transports: [
    new winston.transports.Console({
      format: winston.format.combine(
        winston.format.colorize(),
        winston.format.simple()
      ),
    }),
  ],
});

if (process.env.NODE_ENV === "production") {
  logger.add(
    new winston.transports.File({ filename: "error.log", level: "error" })
  );
  logger.add(new winston.transports.File({ filename: "combined.log" }));
}

export { logger };
*/

// Temporary re-export for backward compatibility during transition
export { logger } from '@shared/utils';
