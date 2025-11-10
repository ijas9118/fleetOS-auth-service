import type { LoginDTO } from "@/dto/login.dto";
import type { RegisterDTO } from "@/dto/register.dto";
import type { VerifyOtpDTO } from "@/dto/verify-otp.dto";

export type IAuthService = {
  register: (data: RegisterDTO) => any;
  verifyAndRegister: (data: VerifyOtpDTO) => any;
  login: (data: LoginDTO) => any;
  refreshToken: (token: string) => any;
};
