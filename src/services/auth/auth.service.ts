import type { SignOptions } from "jsonwebtoken";

import bcrypt from "bcryptjs";
import { inject } from "inversify";
import jwt from "jsonwebtoken";

import type { LoginDTO } from "@/dto/login.dto";
import type { RegisterDTO } from "@/dto/register.dto";
import type { VerifyOtpDTO } from "@/dto/verify-otp.dto";
import type { ITokenRepository } from "@/repositories/token/token.repository.interface";
import type { IUserRepository } from "@/repositories/user/user.repository.interface";

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

  async register(data: RegisterDTO) {
    const existing = await this._userRepo.getUserByEmail(data.email);
    if (existing) {
      throw new HttpError(MESSAGES.AUTH.EMAIL_ALREADY_EXISTS, STATUS_CODES.CONFLICT);
    }

    const hashedPassword = await bcrypt.hash(data.password, 10);
    data.password = hashedPassword;

    await this._otpService.generateOTP(data);
  }

  async verifyAndRegister(data: VerifyOtpDTO) {
    const savedData = await this._otpService.verifyOtp(data);
    return await this._userRepo.createUser(savedData);
  }

  async login(data: LoginDTO) {
    const user = await this._userRepo.getUserByEmail(data.email);
    if (!user) {
      throw new HttpError(MESSAGES.AUTH.INVALID_CREDENTIALS, STATUS_CODES.UNAUTHORIZED);
    }

    const validPassword = await bcrypt.compare(data.password, user.password);
    if (!validPassword) {
      throw new HttpError(MESSAGES.AUTH.INVALID_CREDENTIALS, STATUS_CODES.UNAUTHORIZED);
    }

    const payload = { sub: user.id, email: user.email, role: user.role };

    const accessToken = jwt.sign(payload, env.PRIVATE_KEY, {
      expiresIn: env.ACCESS_TOKEN_EXP,
      algorithm: "RS256",
    } as SignOptions);

    const refreshToken = jwt.sign(payload, env.PRIVATE_KEY, {
      expiresIn: env.REFRESH_TOKEN_EXP,
      algorithm: "RS256",
    } as SignOptions);

    const decoded = jwt.decode(refreshToken) as jwt.JwtPayload;

    await this._tokenRepo.create({
      user: user._id,
      token: refreshToken,
      expiresAt: new Date((decoded?.exp ?? 0) * 1000),
    });

    return { accessToken, refreshToken };
  }

  async refreshToken(token: string) {
    const decoded = jwt.decode(token) as jwt.JwtPayload;
    const existingToken = await this._tokenRepo.findByToken(token);
    if (!existingToken || existingToken.revoked) {
      await this._tokenRepo.deleteAllTokens(decoded.sub as string);
      throw new HttpError(MESSAGES.TOKEN.INVALID_REFRESH_TOKEN, STATUS_CODES.UNAUTHORIZED);
    }

    existingToken.revoked = true;
    await existingToken.save();

    if (!decoded || !decoded.sub) {
      throw new HttpError(MESSAGES.TOKEN.INVALID_REFRESH_TOKEN, STATUS_CODES.UNAUTHORIZED);
    }

    const payload = { sub: decoded.sub, email: decoded.email, role: decoded.role };

    const accessToken = jwt.sign(payload, env.PRIVATE_KEY, {
      expiresIn: env.ACCESS_TOKEN_EXP,
      algorithm: "RS256",
    } as SignOptions);

    const refreshToken = jwt.sign(payload, env.PRIVATE_KEY, {
      expiresIn: env.REFRESH_TOKEN_EXP,
      algorithm: "RS256",
    } as SignOptions);

    const newDecoded = jwt.decode(refreshToken) as jwt.JwtPayload;

    await this._tokenRepo.create({
      user: existingToken.user.toString(),
      token: refreshToken,
      expiresAt: new Date((newDecoded?.exp ?? 0) * 1000),
    });

    return { accessToken, refreshToken };
  }
}
