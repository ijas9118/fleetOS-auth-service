import type { TokenDTO } from "@/dto/token.dto";
import type { IRefreshToken } from "@/models/refresh-token.model";

export type ITokenRepository = {
  create: (data: TokenDTO) => Promise<IRefreshToken>;
  findByToken: (token: string) => Promise<IRefreshToken | null>;
  revoke: ({ token, user }: Partial<TokenDTO>) => Promise<void>;
  deleteAllTokens: (userId: string) => Promise<void>;
};
