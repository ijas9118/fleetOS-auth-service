import type { Application, Request, Response } from "express";

import cors from "cors";
import express from "express";
import helmet from "helmet";
import { StatusCodes } from "http-status-codes";

import { errorHandler, notFoundHandler } from "./middlewares/error-handler.middleware";
import limiter from "./middlewares/rate-limit.middleware";

export default function createApp(): Application {
  const app = express();

  app.use(helmet());
  app.use(cors());
  app.use(express.json());

  app.use(limiter);

  app.get("/healthz", (_req: Request, res: Response) => {
    res.status(StatusCodes.OK).json({ status: "ok" });
  });

  app.use(notFoundHandler);
  app.use(errorHandler);

  return app;
}
