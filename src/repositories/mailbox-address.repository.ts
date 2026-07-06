import { prisma } from "@/clients/prisma";

export const MailboxAddressRepository = {
  async findById(id: string) {
    return prisma.mailboxAddress.findUnique({
      where: { id },
    });
  },

  async findByAddress(address: string, onlyActive = false) {
    if (onlyActive) {
      return prisma.mailboxAddress.findFirst({
        where: { address, isActive: true },
      });
    }
    return prisma.mailboxAddress.findUnique({
      where: { address },
    });
  },

  async findAll(includeInactive = true) {
    return prisma.mailboxAddress.findMany({
      where: includeInactive ? {} : { isActive: true },
      orderBy: { createdAt: "asc" },
    });
  },

  async create(data: {
    address: string;
    displayName?: string;
    isActive?: boolean;
  }) {
    return prisma.mailboxAddress.create({
      data,
    });
  },

  async update(
    id: string,
    data: { address?: string; displayName?: string; isActive?: boolean },
  ) {
    return prisma.mailboxAddress.update({
      where: { id },
      data,
    });
  },

  async delete(id: string) {
    // Perform cascading deletes of emails associated with this mailbox address
    return prisma.$transaction(async (tx) => {
      // 1. Delete all emails belonging to this mailbox address
      // (UserReadEmail and UserSavedEmail reference Email with onDelete: Cascade, so they will auto-delete)
      await tx.email.deleteMany({
        where: { mailboxAddressId: id },
      });

      // 2. Delete the mailbox address itself
      return tx.mailboxAddress.delete({
        where: { id },
      });
    });
  },

  async softDelete(id: string) {
    return prisma.mailboxAddress.update({
      where: { id },
      data: { isActive: false },
    });
  },
};
