import { STATUS_CODES } from "@/config/constants/status-codes.constant";
import logger from "@/config/logger";
import env from "@/config/validate-env";
import { errorHandler, notFoundHandler } from "@/middlewares/error-handler.middleware";

describe("error and notFound handlers", () => {
  const mockReq: any = { method: "GET", originalUrl: "/test" };
  const mockRes: any = {
    status: jest.fn().mockReturnThis(),
    json: jest.fn(),
  };
  const mockNext = jest.fn();

  afterEach(() => {
    jest.clearAllMocks();
  });

  it("should handle 404 correctly", () => {
    notFoundHandler(mockReq, mockRes, mockNext);

    expect(logger.warn).toHaveBeenCalledWith(expect.stringContaining("404 Not Found"));
    expect(mockRes.status).toHaveBeenCalledWith(STATUS_CODES.NOT_FOUND);
    expect(mockRes.json).toHaveBeenCalledWith({
      success: false,
      error: {
        message: "Resource not found: GET /test",
        path: "/test",
        method: "GET",
      },
    });
  });

  it("should handle error in development", () => {
    const err = new Error("Something went wrong, please try again later.");
    errorHandler(err, mockReq, mockRes, mockNext);

    expect(logger.error).toHaveBeenCalledWith(
      expect.stringContaining("Unhandled error: Something went wrong, please try again later."),
      expect.objectContaining({ stack: expect.any(String), path: "/test" }),
    );

    expect(mockRes.status).toHaveBeenCalledWith(STATUS_CODES.INTERNAL_SERVER_ERROR);
    expect(mockRes.json).toHaveBeenCalledWith({
      success: false,
      error: {
        message: "Something went wrong, please try again later.",
        path: "/test",
        method: "GET",
      },
    });
  });

  it("should mask message in production mode", async () => {
    (env as any).NODE_ENV = "production";

    const err = new Error("Sensitive details");
    errorHandler(err, mockReq, mockRes, mockNext);

    expect(mockRes.json).toHaveBeenCalledWith({
      success: false,
      error: expect.objectContaining({
        message: "Something went wrong, please try again later.",
      }),
    });
  });

  it("should respect provided statusCode", () => {
    const err = Object.assign(new Error("Bad request"), { statusCode: 400 });
    errorHandler(err, mockReq, mockRes, mockNext);

    expect(mockRes.status).toHaveBeenCalledWith(400);
  });
});
