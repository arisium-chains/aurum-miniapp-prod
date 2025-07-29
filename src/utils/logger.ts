import winston from "winston";
import DailyRotateFile from "winston-daily-rotate-file";
import { config } from "@/config";

const logFormat = winston.format.combine(
  winston.format.timestamp({ format: "YYYY-MM-DD HH:mm:ss" }),
  winston.format.errors({ stack: true }),
  winston.format.json()
);

const consoleFormat = winston.format.combine(
  winston.format.colorize(),
  winston.format.simple(),
  winston.format.printf(({ timestamp, level, message, stack }) => {
    return `${timestamp} [${level}]: ${stack || message}`;
  })
);

const transports: winston.transport[] = [
  new winston.transports.Console({
    format: consoleFormat,
    level: config.logging.level,
  }),
];

if (config.env === "production") {
  const errorTransport = new DailyRotateFile({
    filename: `${config.logging.dir}/error-%DATE%.log`,
    datePattern: "YYYY-MM-DD",
    level: "error",
    maxSize: "20m",
    maxFiles: "14d",
  });

  const combinedTransport = new DailyRotateFile({
    filename: `${config.logging.dir}/combined-%DATE%.log`,
    datePattern: "YYYY-MM-DD",
    maxSize: "20m",
    maxFiles: "14d",
  });

  transports.push(errorTransport, combinedTransport);
}

export const logger = winston.createLogger({
  level: config.logging.level,
  format: logFormat,
  transports,
  exitOnError: false,
});
