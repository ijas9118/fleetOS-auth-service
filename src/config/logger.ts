import winston from "winston";

import env from "./validate-env";

const { combine, timestamp, printf, colorize, json, errors, align } = winston.format;

// Human-readable dev format
const devFormat = combine(
  colorize(),
  timestamp({ format: "YYYY-MM-DD HH:mm:ss" }),
  align(),
  printf(({ level, message, timestamp, stack }) => {
    return stack
      ? `[${timestamp}] ${level}: ${message}\n${stack}`
      : `[${timestamp}] ${level}: ${message}`;
  }),
);

// JSON structured logs for production
const prodFormat = combine(
  timestamp(),
  errors({ stack: true }),
  json(),
);

const logger = winston.createLogger({
  level: env.LOG_LEVEL || "info",
  format: env.NODE_ENV === "production" ? prodFormat : devFormat,
  transports: [
    new winston.transports.Console({
      handleExceptions: true,
    }),
  ],
  exitOnError: false,
});

export default logger;
