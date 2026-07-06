import crypto from "node:crypto";
import { AUTH_CONFIG } from "@/lib/auth";
import { TokenRepository } from "@/repositories/token.repository";

export const TokenService = {
  async generateResetToken(email: string) {
    const token = crypto.randomBytes(32).toString("hex");

    // Set expiration based on auth config
    const expires = new Date();
    expires.setHours(
      expires.getHours() + AUTH_CONFIG.tokens.resetPasswordExpiresInHours,
    );

    const identifier = `reset:${email}`;
    await TokenRepository.createToken(identifier, token, expires);

    return token;
  },

  async verifyResetToken(token: string) {
    const record = await TokenRepository.findToken(token);

    if (!record) {
      throw new Error("Invalid or expired reset token");
    }

    if (record.expires < new Date()) {
      await TokenRepository.deleteToken(token);
      throw new Error("Reset token has expired");
    }

    return record;
  },

  async deleteToken(token: string) {
    return TokenRepository.deleteToken(token);
  },
};
