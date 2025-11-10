import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";

import { AuthService } from "@/services/auth/auth.service";
import { HttpError } from "@/utils/http-error-class";

jest.mock("bcryptjs");
jest.mock("jsonwebtoken");

describe("authService", () => {
  let userRepoMock: any;
  let otpServiceMock: any;
  let tokenRepoMock: any;
  let authService: AuthService;

  beforeEach(() => {
    userRepoMock = {
      getUserByEmail: jest.fn(),
      createUser: jest.fn(),
    };
    otpServiceMock = {
      generateOTP: jest.fn(),
      verifyOtp: jest.fn(),
    };
    tokenRepoMock = {
      create: jest.fn(),
    };
    authService = new AuthService(userRepoMock, otpServiceMock, tokenRepoMock);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe("register", () => {
    it("should throw if email already exists", async () => {
      userRepoMock.getUserByEmail.mockResolvedValue({ id: "userId" });

      await expect(
        authService.register({ name: "Test", email: "test@example.com", password: "Password1" }),
      ).rejects.toThrow(HttpError);
      expect(userRepoMock.getUserByEmail).toHaveBeenCalledWith("test@example.com");
    });

    it("should hash password and call generateOTP if email not exists", async () => {
      userRepoMock.getUserByEmail.mockResolvedValue(null);
      (bcrypt.hash as jest.Mock).mockResolvedValue("hashedPassword");
      otpServiceMock.generateOTP.mockResolvedValue(undefined);

      await authService.register({ name: "Test", email: "test@example.com", password: "Password1" });

      expect(bcrypt.hash).toHaveBeenCalledWith("Password1", 10);
      expect(otpServiceMock.generateOTP).toHaveBeenCalledWith(expect.objectContaining({ password: "hashedPassword" }));
    });
  });

  describe("verifyAndRegister", () => {
    it("should verify OTP and create user", async () => {
      const verifiedData = { email: "test@example.com", name: "Test" };
      otpServiceMock.verifyOtp.mockResolvedValue(verifiedData);
      userRepoMock.createUser.mockResolvedValue({ id: "userId", ...verifiedData });

      const result = await authService.verifyAndRegister({ email: "test@example.com", otp: "123456" });

      expect(otpServiceMock.verifyOtp).toHaveBeenCalledWith({ email: "test@example.com", otp: "123456" });
      expect(userRepoMock.createUser).toHaveBeenCalledWith(verifiedData);
      expect(result).toEqual({ id: "userId", ...verifiedData });
    });
  });

  describe("login", () => {
    const userFromDb = {
      id: "userId",
      _id: "userObjectId",
      email: "test@example.com",
      password: "hashedPassword",
      role: "user",
    };

    beforeEach(() => {
      (jwt.sign as jest.Mock).mockImplementation(payload => `token-for-${payload.sub}`);
      (jwt.decode as jest.Mock).mockReturnValue({ exp: Math.floor(Date.now() / 1000 + 7 * 24 * 60 * 60) });
    });

    it("should throw if user not found", async () => {
      userRepoMock.getUserByEmail.mockResolvedValue(null);

      await expect(authService.login({ email: "wrong@example.com", password: "Password1" })).rejects.toThrow(HttpError);
    });

    it("should throw if password is invalid", async () => {
      userRepoMock.getUserByEmail.mockResolvedValue(userFromDb);
      (bcrypt.compare as jest.Mock).mockResolvedValue(false);

      await expect(authService.login({ email: "test@example.com", password: "wrongpass" })).rejects.toThrow(HttpError);
    });

    it("should return tokens and save refresh token", async () => {
      userRepoMock.getUserByEmail.mockResolvedValue(userFromDb);
      (bcrypt.compare as jest.Mock).mockResolvedValue(true);

      const tokens = await authService.login({ email: "test@example.com", password: "Password1" });

      expect(tokens).toHaveProperty("accessToken");
      expect(tokens).toHaveProperty("refreshToken");
      expect(userRepoMock.getUserByEmail).toHaveBeenCalledWith("test@example.com");
      expect(tokenRepoMock.create).toHaveBeenCalledWith(
        expect.objectContaining({ user: userFromDb._id, token: expect.any(String), expiresAt: expect.any(Date) }),
      );
    });
  });
});
