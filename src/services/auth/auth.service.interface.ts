import type { AuthTokens, AuthUser } from "@/dto/auth.response.dto";
import type { LoginDTO } from "@/dto/login.dto";
import type { RegisterDTO } from "@/dto/register.dto";
import type { VerifyOtpDTO } from "@/dto/verify-otp.dto";

export type IAuthService = {
  /**
   * Starts the user registration process by validating email uniqueness
   * and generating an OTP. The OTP must be sent to the user for email
   * verification before the account is created.
   *
   * @param data - User-provided registration details.
   * @returns A promise that resolves when the OTP has been generated and stored.
   * @throws HttpError if email already exists or OTP storage fails.
   */
  register: (data: RegisterDTO) => Promise<void>;

  /**
   * Verifies a submitted OTP and, upon success, creates the user account
   * using the data previously stored during registration.
   *
   * @param data - Email and OTP submitted for verification.
   * @returns The newly created user object.
   * @throws HttpError if the OTP is invalid or expired.
   */
  verifyAndRegister: (data: VerifyOtpDTO) => Promise<AuthUser>;

  /**
   * Authenticates a user by validating their credentials and generating
   * a new access and refresh token pair.
   *
   * @param data - User login credentials.
   * @returns An access token and refresh token for the authenticated user.
   * @throws HttpError if the credentials are invalid.
   */
  login: (data: LoginDTO) => Promise<AuthTokens>;

  /**
   * Refreshes authentication tokens using a valid, non-revoked refresh token.
   * The old refresh token is revoked, and a new token pair is returned.
   *
   * @param token - The refresh token provided by the client.
   * @returns A new access token and refresh token pair.
   * @throws HttpError if the refresh token is invalid, expired, or revoked.
   */
  refreshToken: (token: string) => Promise<AuthTokens>;

  /**
   * Logs the user out from the current session by revoking the provided
   * refresh token. Does nothing if the token is not found.
   *
   * @param token - The refresh token to revoke.
   * @returns A promise that resolves once the token is revoked.
   * @throws HttpError if token parsing fails.
   */
  logout: (token: string) => Promise<void>;

  /**
   * Logs the user out from all devices by revoking all stored refresh tokens
   * associated with the given user ID.
   *
   * @param userId - ID of the user whose sessions must be cleared.
   * @returns A promise that resolves once all tokens are revoked.
   */
  logoutAllSessions: (userId: string) => Promise<void>;
};
