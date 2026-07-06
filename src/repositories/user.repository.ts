import type { Prisma } from "@prisma/client";
import { prisma } from "@/clients/prisma";

export const UserRepository = {
  async createUser(data: Prisma.UserCreateInput, mailboxAddressIds?: string[]) {
    return prisma.$transaction(async (tx) => {
      const user = await tx.user.create({
        data,
      });

      if (mailboxAddressIds && mailboxAddressIds.length > 0) {
        await tx.userMailboxAccess.createMany({
          data: mailboxAddressIds.map((mailboxAddressId) => ({
            userId: user.id,
            mailboxAddressId,
          })),
        });
      }

      return tx.user.findUnique({
        where: { id: user.id },
        include: { mailboxAccess: true },
      }) as unknown as NonNullable<
        Awaited<ReturnType<typeof tx.user.findUnique>>
      >;
    });
  },

  async findUserByEmail(email: string) {
    return prisma.user.findUnique({
      where: { email },
      include: { mailboxAccess: true },
    });
  },

  async findUserById(id: string) {
    return prisma.user.findUnique({
      where: { id },
      include: { mailboxAccess: true },
    });
  },

  async countOwners() {
    return prisma.user.count({
      where: { role: "OWNER" },
    });
  },

  async updatePassword(id: string, passwordHash: string) {
    return prisma.user.update({
      where: { id },
      data: { passwordHash },
    });
  },

  async findAllUsers() {
    return prisma.user.findMany({
      orderBy: { createdAt: "asc" },
      include: { mailboxAccess: true },
    });
  },

  async deleteUser(id: string) {
    return prisma.user.delete({
      where: { id },
    });
  },

  async updateUser(
    id: string,
    data: {
      firstName?: string;
      lastName?: string;
      email?: string;
      role?: string;
      isActive?: boolean;
      isBanned?: boolean;
    },
    mailboxAddressIds?: string[],
  ) {
    return prisma.$transaction(async (tx) => {
      const _user = await tx.user.update({
        where: { id },
        data,
      });

      if (mailboxAddressIds !== undefined) {
        // Clear existing access
        await tx.userMailboxAccess.deleteMany({
          where: { userId: id },
        });

        // Add new access
        if (mailboxAddressIds.length > 0) {
          await tx.userMailboxAccess.createMany({
            data: mailboxAddressIds.map((mailboxAddressId) => ({
              userId: id,
              mailboxAddressId,
            })),
          });
        }
      }

      return tx.user.findUnique({
        where: { id },
        include: { mailboxAccess: true },
      }) as unknown as NonNullable<
        Awaited<ReturnType<typeof tx.user.findUnique>>
      >;
    });
  },

  async createVerificationToken(email: string, token: string, expires: Date) {
    return prisma.verificationToken.create({
      data: {
        identifier: email,
        token,
        expires,
      },
    });
  },

  async findVerificationToken(token: string) {
    return prisma.verificationToken.findUnique({
      where: { token },
    });
  },

  async deleteVerificationToken(token: string) {
    return prisma.verificationToken.delete({
      where: { token },
    });
  },

  async findAllActiveVerificationTokens() {
    return prisma.verificationToken.findMany({
      where: {
        expires: {
          gt: new Date(),
        },
      },
    });
  },
};
