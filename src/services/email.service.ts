import { EmailRepository } from "@/repositories/email.repository";
import { MailboxAddressRepository } from "@/repositories/mailbox-address.repository";
import { UserRepository } from "@/repositories/user.repository";
import type { EmailThread, EmailWithState } from "@/types";
import { InboundEmailSchema } from "@/types";

// Strip "Re:", "Fwd:", "Re: Fwd:", etc. from the start of a subject line,
// then trim and lowercase so replies group with their original message.
function normaliseSubject(subject: string): string {
  return subject
    .replace(/^(re|fwd|fw|aw|wg)(\[\d+\])?:\s*/gi, "")
    .trim()
    .toLowerCase();
}

export const EmailService = {
  // ── Inbound webhook ───────────────────────────────────────────────────────

  async processInbound(payload: unknown) {
    // 1. Validate payload shape
    const parsed = InboundEmailSchema.safeParse(payload);
    if (!parsed.success) {
      throw new Error("Invalid email payload");
    }

    const { messageId, from, to, subject, text, html, inReplyTo, references } =
      parsed.data;

    // 2. Dedup — if we've seen this messageId before, skip silently
    const existing = await EmailRepository.findByMessageId(messageId);
    if (existing) return existing;

    // 3. Find the target mailbox address from the `to` list (must be active)
    let mailboxAddress = null;
    for (const recipient of to) {
      mailboxAddress = await MailboxAddressRepository.findByAddress(
        recipient.address,
        true,
      );
      if (mailboxAddress) break;
    }

    if (!mailboxAddress) {
      throw new Error(
        `No active mailbox found for recipients: ${to.map((r) => r.address).join(", ")}`,
      );
    }

    // 4. Store email
    const resolvedSubject = subject || "(no subject)";
    return EmailRepository.create({
      mailboxAddressId: mailboxAddress.id,
      messageId,
      inReplyTo,
      references,
      threadKey: normaliseSubject(resolvedSubject),
      fromAddress: from.address,
      fromName: from.name,
      subject: resolvedSubject,
      bodyText: text || "",
      bodyHtml: html,
    });
  },

  // ── List ─────────────────────────────────────────────────────────────────

  async list(
    userId: string,
    opts: {
      search?: string;
      page?: number;
      limit?: number;
      trashed?: boolean;
      starred?: boolean;
    },
  ) {
    const user = await UserRepository.findUserById(userId);
    if (!user) throw new Error("User not found");

    let allowedMailboxIds: string[] | undefined;
    if (user.role !== "OWNER") {
      allowedMailboxIds = user.mailboxAccess.map((ma) => ma.mailboxAddressId);
      if (allowedMailboxIds.length === 0) {
        return {
          items: [],
          total: 0,
          page: opts.page || 1,
          limit: opts.limit || 10,
          totalPages: 0,
        };
      }
    }

    const { emails, total, page, limit } = await EmailRepository.findMany({
      userId,
      allowedMailboxIds,
      ...opts,
    });

    // Attach per-user isRead / isSaved / isTrashed flags
    const items = emails.map((email) => ({
      ...email,
      threadKey: email.threadKey ?? email.id,
      isRead: email.readBy.length > 0,
      isSaved: email.savedBy.length > 0,
      isTrashed: email.trashedBy.length > 0,
      readBy: undefined,
      savedBy: undefined,
      trashedBy: undefined,
    }));

    return {
      items,
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit),
    };
  },

  // ── List as threads ──────────────────────────────────────────────────────
  // Returns emails grouped by threadKey, sorted by latest message desc.
  // Each thread carries its full email list (oldest→newest) plus aggregate flags.

  async listThreads(
    userId: string,
    opts: {
      search?: string;
      trashed?: boolean;
      starred?: boolean;
    },
  ): Promise<EmailThread[]> {
    const user = await UserRepository.findUserById(userId);
    if (!user) throw new Error("User not found");

    let allowedMailboxIds: string[] | undefined;
    if (user.role !== "OWNER") {
      allowedMailboxIds = user.mailboxAccess.map((ma) => ma.mailboxAddressId);
      if (allowedMailboxIds.length === 0) return [];
    }

    const rawEmails = await EmailRepository.findThreads({
      userId,
      allowedMailboxIds,
      ...opts,
    });

    // Attach per-user flags and strip Prisma join fields
    const emails: EmailWithState[] = rawEmails.map((email) => ({
      ...email,
      threadKey: email.threadKey ?? email.id,
      isRead: email.readBy.length > 0,
      isSaved: email.savedBy.length > 0,
      isTrashed: email.trashedBy.length > 0,
      readBy: undefined,
      savedBy: undefined,
      trashedBy: undefined,
    }));

    // Group by threadKey, preserving insertion order (emails are asc by receivedAt)
    const threadMap = new Map<string, EmailWithState[]>();
    for (const email of emails) {
      const group = threadMap.get(email.threadKey);
      if (group) {
        group.push(email);
      } else {
        threadMap.set(email.threadKey, [email]);
      }
    }

    // Build EmailThread objects and sort threads by latest message desc
    const threads: EmailThread[] = [];
    for (const [threadKey, threadEmails] of threadMap) {
      const latestEmail = threadEmails[threadEmails.length - 1];
      threads.push({
        threadKey,
        subject: threadEmails[0].subject,
        emails: threadEmails,
        latestEmail,
        hasUnread: threadEmails.some((e) => !e.isRead),
        isSaved: threadEmails.some((e) => e.isSaved),
        isTrashed: threadEmails.every((e) => e.isTrashed),
        messageCount: threadEmails.length,
      });
    }

    threads.sort(
      (a, b) =>
        new Date(b.latestEmail.receivedAt).getTime() -
        new Date(a.latestEmail.receivedAt).getTime(),
    );

    return threads;
  },

  // ── Get one ──────────────────────────────────────────────────────────────

  async getById(userId: string, emailId: string) {
    const user = await UserRepository.findUserById(userId);
    if (!user) throw new Error("User not found");

    const email = await EmailRepository.findById(emailId, userId);
    if (!email) throw new Error("Email not found");

    if (user.role !== "OWNER") {
      const allowedMailboxIds = user.mailboxAccess.map(
        (ma) => ma.mailboxAddressId,
      );
      if (!allowedMailboxIds.includes(email.mailboxAddressId)) {
        throw new Error("Email not found");
      }
    }

    return {
      ...email,
      threadKey: email.threadKey ?? email.id,
      isRead: email.readBy.length > 0,
      isSaved: email.savedBy.length > 0,
      isTrashed: email.trashedBy.length > 0,
      readBy: undefined,
      savedBy: undefined,
      trashedBy: undefined,
    };
  },

  // ── User actions ─────────────────────────────────────────────────────────

  async updateState(
    userId: string,
    emailId: string,
    action: "read" | "unread" | "save" | "unsave" | "trash" | "restore",
  ) {
    // Verify email exists
    const email = await EmailRepository.findById(emailId, userId);
    if (!email) throw new Error("Email not found");

    switch (action) {
      case "read":
        await EmailRepository.markRead(userId, emailId);
        break;
      case "unread":
        await EmailRepository.markUnread(userId, emailId);
        break;
      case "save":
        await EmailRepository.saveEmail(userId, emailId);
        break;
      case "unsave":
        await EmailRepository.unsaveEmail(userId, emailId);
        break;
      case "trash":
        await EmailRepository.trashEmail(userId, emailId);
        break;
      case "restore":
        await EmailRepository.restoreEmail(userId, emailId);
        break;
    }

    return { action, emailId };
  },

  // ── Hard delete ──────────────────────────────────────────────────────────

  async hardDelete(userId: string, emailId: string) {
    // Verify the email is in this user's trash before allowing permanent deletion
    const email = await EmailRepository.findById(emailId, userId);
    if (!email) throw new Error("Email not found");

    const isTrashed = email.trashedBy.length > 0;
    if (!isTrashed) {
      throw new Error(
        "Email must be in trash before it can be permanently deleted",
      );
    }

    return EmailRepository.hardDelete(emailId);
  },
};
