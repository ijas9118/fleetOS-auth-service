import rateLimit from "express-rate-limit";
import { StatusCodes } from "http-status-codes";

const limiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 100,
  handler: (_req, res) => {
    res.status(StatusCodes.TOO_MANY_REQUESTS).json({
      message: "Too many requests. Please try again later.",
      timestamp: new Date().toISOString(),
    });
  },
});

export default limiter;
