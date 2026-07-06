import crypto from "node:crypto";
import { prisma } from "@/clients/prisma";
import { AUTH_CONFIG } from "@/lib/auth";

export const SessionService = {
  async createSession(userId: string) {
    // Generate a secure random token
    const sessionToken = crypto.randomBytes(32).toString("hex");

    // Set expiration date based on config
    const expires = new Date();
    expires.setDate(expires.getDate() + AUTH_CONFIG.session.durationDays);

    const session = await prisma.session.create({
      data: {
        sessionToken,
        userId,
        expires,
      },
    });

    return session;
  },

  async getSessionAndUser(sessionToken: string) {
    const session = await prisma.session.findUnique({
      where: { sessionToken },
      include: { user: { include: { mailboxAccess: true } } },
    });

    if (!session) return null;

    // Check expiration
    if (session.expires < new Date()) {
      await this.deleteSession(sessionToken);
      return null;
    }

    // Terminate session if user is banned
    if (session.user.isBanned) {
      await this.deleteSession(sessionToken);
      return null;
    }

    // Strip passwordHash before returning user
    const { passwordHash: _, ...safeUser } = session.user;
    return { session, user: safeUser };
  },

  async deleteSession(sessionToken: string) {
    return prisma.session.delete({
      where: { sessionToken },
    });
  },
};
