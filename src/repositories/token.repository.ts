import { prisma } from "@/clients/prisma";

export const TokenRepository = {
  async createToken(identifier: string, token: string, expires: Date) {
    // Delete any existing tokens for this identifier (cleanup)
    await prisma.verificationToken.deleteMany({
      where: { identifier },
    });

    return prisma.verificationToken.create({
      data: {
        identifier,
        token,
        expires,
      },
    });
  },

  async findToken(token: string) {
    return prisma.verificationToken.findUnique({
      where: { token },
    });
  },

  async deleteToken(token: string) {
    return prisma.verificationToken.delete({
      where: { token },
    });
  },
};
