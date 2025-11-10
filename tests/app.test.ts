import request from "supertest";

import createApp from "@/app";
import { STATUS_CODES } from "@/config/constants/status-codes.constant";
import logger from "@/config/logger";

jest.mock("@/config/logger", () => ({
  warn: jest.fn(),
}));

const app = createApp();

describe("createApp()", () => {
  afterEach(() => {
    jest.clearAllMocks();
  });

  it("should respond to /healthz with 200 and correct JSON", async () => {
    const res = await request(app).get("/healthz");

    expect(res.status).toBe(STATUS_CODES.OK);
    expect(res.body).toEqual({ status: "ok" });
  });

  it("should return 404 and log warning for unknown route", async () => {
    const res = await request(app).get("/nonexistent");

    expect(res.status).toBe(STATUS_CODES.NOT_FOUND);
    expect(res.body).toEqual({
      success: false,
      error: {
        message: "Resource not found: GET /nonexistent",
        path: "/nonexistent",
        method: "GET",
      },
    });

    expect(logger.warn).toHaveBeenCalledWith(expect.stringContaining("404 Not Found"));
  });

  it("should block requests exceeding the rate limit", async () => {
    // Make more than 100 requests (the configured limit)
    const requests = Array.from({ length: 101 }, () => request(app).get("/healthz"));

    const responses = await Promise.all(requests);

    const tooMany = responses.filter(
      r => r.status === STATUS_CODES.TOO_MANY_REQUESTS,
    );

    expect(tooMany.length).toBeGreaterThan(0);
    expect(tooMany[0].body).toMatchObject({
      message: "Too many requests. Please try again later.",
    });
  });
});
