import type { Role } from "@/config/constants/roles.constant";

export type JWTPayload = {
  sub: string;
  email: string;
  role: Role;
  exp?: number;
};

export type StoredOtp = {
  name: string;
  email: string;
  password: string;
  otp: string;
};
