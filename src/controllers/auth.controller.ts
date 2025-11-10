import type { Request, Response } from "express";

import { inject, injectable } from "inversify";

import type { LoginDTO } from "@/dto/login.dto";
import type { RegisterDTO } from "@/dto/register.dto";
import type { IAuthService } from "@/services/auth/auth.service.interface";
import type { IOtpService } from "@/services/otp/otp.service.interface";

import { MESSAGES } from "@/config/constants/messages.constant";
import { STATUS_CODES } from "@/config/constants/status-codes.constant";
import env from "@/config/validate-env";
import TYPES from "@/di/types";

@injectable()
export class AuthController {
  constructor(
    @inject(TYPES.AuthService) private _authService: IAuthService,
    @inject(TYPES.OtpService) private _otpService: IOtpService,
  ) {}

  register = async (req: Request, res: Response) => {
    const data: RegisterDTO = req.body;
    await this._authService.register(data);
    res.status(STATUS_CODES.OK).json({ message: MESSAGES.OTP.SENT });
  };

  verifyAndRegister = async (req: Request, res: Response) => {
    const { otp, email } = req.body;
    await this._authService.verifyAndRegister({ otp, email });
    res.status(STATUS_CODES.OK).json({ message: MESSAGES.AUTH.REGISTER_SUCCESS });
  };

  resendOTP = async (req: Request, res: Response) => {
    const { email } = req.body;
    await this._otpService.resendOTP(email);
    res.status(STATUS_CODES.OK).json({ message: MESSAGES.OTP.SENT });
  };

  login = async (req: Request, res: Response) => {
    const data: LoginDTO = req.body;
    const tokens = await this._authService.login(data);

    res.cookie("refreshToken", tokens.refreshToken, {
      httpOnly: true,
      secure: env.NODE_ENV === "production",
      sameSite: "strict",
      path: "/api/v1/auth/refresh-token",
    });
    res.status(STATUS_CODES.OK).json({ message: MESSAGES.AUTH.LOGIN_SUCCESS, data: { accessToken: tokens.accessToken } });
  };

  refresh = async (req: Request, res: Response) => {
    const { refreshToken } = req.body;

    const tokens = await this._authService.refreshToken(refreshToken);
    res.status(STATUS_CODES.OK).json({ message: MESSAGES.TOKEN.NEW_TOKENS, tokens });
  };
}
