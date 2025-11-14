import type { SignOptions } from "jsonwebtoken";

import bcrypt from "bcryptjs";
import { inject } from "inversify";
import jwt from "jsonwebtoken";

import type { AuthTokens, AuthUser } from "@/dto/auth.response.dto";
import type { LoginDTO } from "@/dto/login.dto";
import type { RegisterDTO } from "@/dto/register.dto";
import type { VerifyOtpDTO } from "@/dto/verify-otp.dto";
import type { ITokenRepository } from "@/repositories/token/token.repository.interface";
import type { IUserRepository } from "@/repositories/user/user.repository.interface";
import type { JWTPayload } from "@/types";

import { MESSAGES } from "@/config/constants/messages.constant";
import { STATUS_CODES } from "@/config/constants/status-codes.constant";
import env from "@/config/validate-env";
import TYPES from "@/di/types";
import { HttpError } from "@/utils/http-error-class";

import type { IOtpService } from "../otp/otp.service.interface";
import type { IAuthService } from "./auth.service.interface";

export class AuthService implements IAuthService {
  constructor(
    @inject(TYPES.UserRepository) private _userRepo: IUserRepository,
    @inject(TYPES.OtpService) private _otpService: IOtpService,
    @inject(TYPES.TokenRepository) private _tokenRepo: ITokenRepository,
  ) {}

  /* -------------------------------------------------------------------------- */
  /*                               Helper Methods                               */
  /* -------------------------------------------------------------------------- */

  private _hashPassword(password: string): Promise<string> {
    return bcrypt.hash(password, 10);
  }

  private _validatePassword(raw: string, hashed: string): Promise<boolean> {
    return bcrypt.compare(raw, hashed);
  }

  private _createJwtPayload(user: any) {
    return { sub: user.id, email: user.email, role: user.role };
  }

  private _signToken(payload: object, expiresIn: string): string {
    const options = {
      expiresIn,
      algorithm: "RS256",
    } as SignOptions;

    return jwt.sign(payload, env.PRIVATE_KEY, options);
  }

  private _decodeToken(token: string): JWTPayload {
    const decoded = jwt.decode(token) as JWTPayload;
    if (!decoded || typeof decoded === "string") {
      throw new HttpError(MESSAGES.TOKEN.INVALID_REFRESH_TOKEN, STATUS_CODES.UNAUTHORIZED);
    }
    return decoded;
  }

  private async _deleteAllTokens(userId: string) {
    await this._tokenRepo.deleteAllTokens(userId);
  }

  private _generateTokens(payload: JWTPayload) {
    const accessToken = this._signToken(payload, env.ACCESS_TOKEN_EXP);
    const refreshToken = this._signToken(payload, env.REFRESH_TOKEN_EXP);
    return { accessToken, refreshToken };
  }

  private async _storeRefreshToken(userId: string, token: string) {
    const { exp } = this._decodeToken(token);
    await this._tokenRepo.create({
      user: userId,
      token,
      expiresAt: new Date(exp! * 1000),
    });
  }

  private async _validateStoredRefreshToken(token: string, decoded: JWTPayload) {
    const storedToken = await this._tokenRepo.findByToken(token);

    if (!storedToken || storedToken.revoked) {
      await this._deleteAllTokens(decoded.sub as string);
      throw new HttpError(MESSAGES.TOKEN.INVALID_REFRESH_TOKEN, STATUS_CODES.UNAUTHORIZED);
    }

    return storedToken;
  }

  /* -------------------------------------------------------------------------- */
  /*                                  Services                                  */
  /* -------------------------------------------------------------------------- */

  async register(data: RegisterDTO): Promise<void> {
    const existingUser = await this._userRepo.getUserByEmail(data.email);
    if (existingUser) {
      throw new HttpError(MESSAGES.AUTH.EMAIL_ALREADY_EXISTS, STATUS_CODES.CONFLICT);
    }

    const hashedPassword = await this._hashPassword(data.password);
    await this._otpService.generateOTP({ ...data, password: hashedPassword });
  }

  async verifyAndRegister(data: VerifyOtpDTO): Promise<AuthUser> {
    const savedData = await this._otpService.verifyOtp(data);
    const user = await this._userRepo.createUser(savedData);

    return {
      id: user._id.toString(),
      email: user.email,
      role: user.role,
    };
  }

  async login(data: LoginDTO): Promise<AuthTokens> {
    const user = await this._userRepo.getUserByEmail(data.email);
    if (!user) {
      throw new HttpError(MESSAGES.AUTH.INVALID_CREDENTIALS, STATUS_CODES.UNAUTHORIZED);
    }

    const isPasswordValid = await this._validatePassword(data.password, user.password);
    if (!isPasswordValid) {
      throw new HttpError(MESSAGES.AUTH.INVALID_CREDENTIALS, STATUS_CODES.UNAUTHORIZED);
    }

    const payload = this._createJwtPayload(user);
    const tokens = this._generateTokens(payload);

    await this._storeRefreshToken(user._id, tokens.refreshToken);

    return tokens;
  }

  async refreshToken(token: string): Promise<AuthTokens> {
    const decoded = this._decodeToken(token);
    const storedToken = await this._validateStoredRefreshToken(token, decoded);

    storedToken.revoked = true;
    await storedToken.save();

    const payload: JWTPayload = {
      sub: decoded.sub,
      email: decoded.email,
      role: decoded.role,
    };

    const newTokens = this._generateTokens(payload);

    await this._storeRefreshToken(storedToken.user.toString(), newTokens.refreshToken);

    return newTokens;
  }

  async logout(token: string): Promise<void> {
    const decoded = this._decodeToken(token); // ! Get userid from headers instead
    const storedToken = await this._tokenRepo.findByToken(token);

    if (!storedToken)
      return;

    await this._tokenRepo.revoke({ token, user: decoded.sub });
  }

  async logoutAllSessions(userId: string): Promise<void> {
    await this._deleteAllTokens(userId);
  }
}
