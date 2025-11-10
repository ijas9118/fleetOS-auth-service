import { injectable } from "inversify";

import type { TokenDTO } from "@/dto/token.dto";
import type { IRefreshToken } from "@/models/refresh-token.model";

import RefreshToken from "@/models/refresh-token.model";

import type { ITokenRepository } from "./token.repository.interface";

@injectable()
export class TokenRepository implements ITokenRepository {
  async create(data: TokenDTO): Promise<IRefreshToken> {
    const token = new RefreshToken(data);
    return token.save();
  }

  async findByToken(token: string): Promise<IRefreshToken | null> {
    return RefreshToken.findOne({ token });
  }

  async revoke({ token, user }: Partial<TokenDTO>): Promise<void> {
    await RefreshToken.findOneAndUpdate({ token, user }, { revoked: true });
  }

  async deleteAllTokens(userId: string): Promise<void> {
    await RefreshToken.deleteMany({ user: userId });
  }
}
