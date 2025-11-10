import type { NextFunction, Request, Response } from "express";

import { MESSAGES } from "@/config/constants/messages.constant";
import { STATUS_CODES } from "@/config/constants/status-codes.constant";
import logger from "@/config/logger";
import env from "@/config/validate-env";

export function notFoundHandler(req: Request, res: Response, _next: NextFunction) {
  logger.warn(`404 Not Found: ${req.method} ${req.originalUrl}`);
  res.status(STATUS_CODES.NOT_FOUND).json({
    success: false,
    error: {
      message: `Resource not found: ${req.method} ${req.originalUrl}`,
      path: req.originalUrl,
      method: req.method,
    },
  });
}

export function errorHandler(err: Error & { statusCode?: number }, req: Request, res: Response, _next: NextFunction) {
  const statusCode = err.statusCode ?? STATUS_CODES.INTERNAL_SERVER_ERROR;
  const isProd = env.NODE_ENV === "production";

  logger.error(`Unhandled error: ${err.message}`, { stack: err.stack, path: req.originalUrl });

  res.status(statusCode).json({
    success: false,
    error: {
      message: isProd ? MESSAGES.ERROR.INTERNAL_SERVER_ERROR : err.message,
      path: req.originalUrl,
      method: req.method,
    },
  });
}
