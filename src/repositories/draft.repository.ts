import type { Prisma } from "@prisma/client";
import { prisma } from "@/clients/prisma";

export const DraftRepository = {
  async create(data: Prisma.DraftUncheckedCreateInput) {
    return prisma.draft.create({ data });
  },

  async findById(id: string, userId: string) {
    return prisma.draft.findFirst({
      where: { id, userId },
      include: {
        mailboxAddress: {
          select: { address: true, displayName: true },
        },
      },
    });
  },

  async update(id: string, userId: string, data: Prisma.DraftUpdateInput) {
    // Verify ownership first
    const draft = await prisma.draft.findFirst({ where: { id, userId } });
    if (!draft) throw new Error("Draft not found");

    return prisma.draft.update({
      where: { id },
      data,
    });
  },

  async delete(id: string, userId: string) {
    // Verify ownership first
    const draft = await prisma.draft.findFirst({ where: { id, userId } });
    if (!draft) throw new Error("Draft not found");

    return prisma.draft.delete({
      where: { id },
    });
  },

  async findMany(userId: string) {
    return prisma.draft.findMany({
      where: { userId },
      orderBy: { updatedAt: "desc" },
      include: {
        mailboxAddress: {
          select: { address: true, displayName: true },
        },
      },
    });
  },
};
