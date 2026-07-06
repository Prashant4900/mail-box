import type { Prisma } from "@prisma/client";
import { DraftRepository } from "@/repositories/draft.repository";
import { UserRepository } from "@/repositories/user.repository";
import type { EmailThread, EmailWithState } from "@/types";

export const DraftService = {
  async createDraft(
    userId: string,
    data: Omit<Prisma.DraftUncheckedCreateInput, "userId">,
  ) {
    const user = await UserRepository.findUserById(userId);
    if (!user) throw new Error("User not found");

    if (data.mailboxAddressId) {
      const hasAccess =
        user.role === "OWNER" ||
        user.mailboxAccess.some(
          (ma) => ma.mailboxAddressId === data.mailboxAddressId,
        );
      if (!hasAccess) {
        throw new Error("No access to this mailbox address");
      }
    }

    return DraftRepository.create({ ...data, userId });
  },

  async updateDraft(
    userId: string,
    draftId: string,
    data: Omit<Prisma.DraftUncheckedUpdateInput, "userId">,
  ) {
    return DraftRepository.update(draftId, userId, data);
  },

  async deleteDraft(userId: string, draftId: string) {
    return DraftRepository.delete(draftId, userId);
  },

  async getDraft(userId: string, draftId: string) {
    const draft = await DraftRepository.findById(draftId, userId);
    if (!draft) throw new Error("Draft not found");
    return draft;
  },

  async listAsThreads(userId: string): Promise<EmailThread[]> {
    const drafts = await DraftRepository.findMany(userId);

    return drafts.map((draft): EmailThread => {
      const draftEmail: EmailWithState = {
        id: draft.id,
        mailboxAddressId: draft.mailboxAddressId || "",
        messageId: draft.id, // Placeholder for draft
        inReplyTo: null,
        references: null,
        threadKey: draft.id,
        fromAddress: draft.mailboxAddress?.address || "Draft",
        fromName: draft.mailboxAddress?.displayName || "Draft",
        subject: draft.subject || "(no subject)",
        bodyText: draft.bodyText || "",
        bodyHtml: draft.bodyHtml || null,
        receivedAt: draft.updatedAt, // Use updatedAt to sort
        isRead: true, // Drafts are read
        isSaved: false,
        isTrashed: false,
        mailboxAddress: {
          address: draft.mailboxAddress?.address || "draft",
          displayName: draft.mailboxAddress?.displayName || "Draft",
        },
      };

      return {
        threadKey: draft.id,
        subject: draftEmail.subject,
        emails: [draftEmail],
        latestEmail: draftEmail,
        hasUnread: false,
        isSaved: false,
        isTrashed: false,
        messageCount: 1,
      };
    });
  },
};
