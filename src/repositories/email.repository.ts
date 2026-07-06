import type { Prisma } from "@prisma/client";
import { prisma } from "@/clients/prisma";
import { API_EMAIL_LIMIT } from "@/lib/constants";

export const EmailRepository = {
  // ── Write ────────────────────────────────

  async create(data: {
    mailboxAddressId: string;
    messageId: string;
    inReplyTo?: string;
    references?: string;
    threadKey: string;
    fromAddress: string;
    fromName?: string;
    subject: string;
    bodyText: string;
    bodyHtml?: string;
  }) {
    return prisma.email.create({ data });
  },

  async findByMessageId(messageId: string) {
    return prisma.email.findUnique({ where: { messageId } });
  },

  // ── Read ─────────────────────────────────

  async findMany({
    userId,
    search,
    page = 1,
    limit = API_EMAIL_LIMIT,
    trashed = false,
    starred = false,
    allowedMailboxIds,
  }: {
    userId: string;
    search?: string;
    page?: number;
    limit?: number;
    trashed?: boolean;
    starred?: boolean;
    allowedMailboxIds?: string[];
  }) {
    const baseWhere = search
      ? {
          OR: [
            { subject: { contains: search } },
            { fromAddress: { contains: search } },
            { fromName: { contains: search } },
          ],
        }
      : {};

    // When trashed=false (inbox/starred): exclude emails this user has trashed.
    // When trashed=true (trash): include only emails this user has trashed.
    // When starred=true (starred): include only emails this user has saved (starred).
    const where: Prisma.EmailWhereInput = { ...baseWhere };
    if (trashed) {
      where.trashedBy = { some: { userId } };
    } else {
      where.trashedBy = { none: { userId } };
      if (starred) {
        where.savedBy = { some: { userId } };
      }
    }

    if (allowedMailboxIds) {
      where.mailboxAddressId = { in: allowedMailboxIds };
    }

    const [emails, total] = await Promise.all([
      prisma.email.findMany({
        where,
        orderBy: { receivedAt: "desc" },
        skip: (page - 1) * limit,
        take: limit,
        include: {
          mailboxAddress: { select: { address: true, displayName: true } },
          readBy: { where: { userId }, select: { userId: true } },
          savedBy: { where: { userId }, select: { userId: true } },
          trashedBy: { where: { userId }, select: { userId: true } },
        },
      }),
      prisma.email.count({ where }),
    ]);

    return { emails, total, page, limit };
  },

  // Returns all emails grouped by threadKey, respecting the same
  // trashed/starred filters as findMany. Each group is ordered oldest→newest.
  async findThreads({
    userId,
    search,
    trashed = false,
    starred = false,
    allowedMailboxIds,
  }: {
    userId: string;
    search?: string;
    trashed?: boolean;
    starred?: boolean;
    allowedMailboxIds?: string[];
  }) {
    const baseWhere = search
      ? {
          OR: [
            { subject: { contains: search } },
            { fromAddress: { contains: search } },
            { fromName: { contains: search } },
          ],
        }
      : {};

    const where: Prisma.EmailWhereInput = { ...baseWhere };
    if (trashed) {
      where.trashedBy = { some: { userId } };
    } else {
      where.trashedBy = { none: { userId } };
      if (starred) {
        where.savedBy = { some: { userId } };
      }
    }

    if (allowedMailboxIds) {
      where.mailboxAddressId = { in: allowedMailboxIds };
    }

    return prisma.email.findMany({
      where,
      orderBy: { receivedAt: "asc" },
      include: {
        mailboxAddress: { select: { address: true, displayName: true } },
        readBy: { where: { userId }, select: { userId: true } },
        savedBy: { where: { userId }, select: { userId: true } },
        trashedBy: { where: { userId }, select: { userId: true } },
      },
    });
  },

  async findById(id: string, userId: string) {
    return prisma.email.findUnique({
      where: { id },
      include: {
        mailboxAddress: { select: { address: true, displayName: true } },
        readBy: { where: { userId }, select: { userId: true } },
        savedBy: { where: { userId }, select: { userId: true } },
        trashedBy: { where: { userId }, select: { userId: true } },
      },
    });
  },

  // ── User state (read / saved / trashed) ───

  async markRead(userId: string, emailId: string) {
    return prisma.userReadEmail.upsert({
      where: { userId_emailId: { userId, emailId } },
      create: { userId, emailId },
      update: {},
    });
  },

  async markUnread(userId: string, emailId: string) {
    return prisma.userReadEmail
      .delete({ where: { userId_emailId: { userId, emailId } } })
      .catch(() => null); // no-op if already unread
  },

  async saveEmail(userId: string, emailId: string) {
    return prisma.userSavedEmail.upsert({
      where: { userId_emailId: { userId, emailId } },
      create: { userId, emailId },
      update: {},
    });
  },

  async unsaveEmail(userId: string, emailId: string) {
    return prisma.userSavedEmail
      .delete({ where: { userId_emailId: { userId, emailId } } })
      .catch(() => null);
  },

  async trashEmail(userId: string, emailId: string) {
    return prisma.userTrashedEmail.upsert({
      where: { userId_emailId: { userId, emailId } },
      create: { userId, emailId },
      update: {},
    });
  },

  async restoreEmail(userId: string, emailId: string) {
    return prisma.userTrashedEmail
      .delete({ where: { userId_emailId: { userId, emailId } } })
      .catch(() => null);
  },

  // ── Hard delete ──────────────────────────

  async hardDelete(emailId: string) {
    return prisma.email.delete({ where: { id: emailId } });
  },
};
