import type { NextFunction, Request, Response } from "express";

import { StatusCodes } from "http-status-codes";

import logger from "@/config/logger";
import env from "@/config/validate-env";

export function notFoundHandler(req: Request, res: Response, _next: NextFunction) {
  logger.warn(`404 Not Found: ${req.method} ${req.originalUrl}`);
  res.status(StatusCodes.NOT_FOUND).json({
    success: false,
    error: {
      code: "NOT_FOUND",
      message: `Resource not found: ${req.method} ${req.originalUrl}`,
      path: req.originalUrl,
      method: req.method,
    },
  });
}

export function errorHandler(err: Error & { statusCode?: number }, req: Request, res: Response, _next: NextFunction) {
  const statusCode = err.statusCode ?? StatusCodes.INTERNAL_SERVER_ERROR;
  const isProd = env.NODE_ENV === "production";

  logger.error(`Unhandled error: ${err.message}`, { stack: err.stack, path: req.originalUrl });

  res.status(statusCode).json({
    success: false,
    error: {
      code: "INTERNAL_ERROR",
      message: isProd ? "Something went wrong!!" : err.message,
      path: req.originalUrl,
      method: req.method,
    },
  });
}
