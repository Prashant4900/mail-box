import { z } from "zod";

// Export all shared types, interfaces, and Zod schemas from here

// ─────────────────────────────────────────
// BASE
// ─────────────────────────────────────────

export interface BaseEntity {
  id: string;
  createdAt: Date;
}

// ─────────────────────────────────────────
// AUTH
// ─────────────────────────────────────────

export const UserRoleSchema = z.enum(["OWNER", "ADMIN", "MEMBER"]);
export type UserRole = z.infer<typeof UserRoleSchema>;

export const UserRegistrationSchema = z.object({
  firstName: z.string().min(1, "First name is required"),
  lastName: z.string().min(1, "Last name is required"),
  email: z.string().email("Invalid email address"),
  password: z.string().min(8, "Password must be at least 8 characters long"),
  profileImage: z.string().url().optional(),
  mailboxAddressIds: z.array(z.string()).optional(),
});

export type UserRegistrationInput = z.infer<typeof UserRegistrationSchema>;

export interface User extends BaseEntity {
  firstName: string;
  lastName: string;
  email: string;
  profileImage: string | null;
  role: UserRole;
  isActive: boolean;
  isBanned: boolean;
  isPendingConfirm?: boolean;
  updatedAt: Date;
  mailboxAccess?: { mailboxAddressId: string }[];
}

// ─────────────────────────────────────────
// EMAIL CORE
// ─────────────────────────────────────────

// MailboxAddress
export interface MailboxAddress extends BaseEntity {
  address: string;
  displayName: string | null;
  isActive: boolean;
  cloudflareLinked: boolean;
}

// Email — does not extend BaseEntity because the model has no createdAt column
// (it uses receivedAt instead). Only id is shared with BaseEntity.
export interface Email {
  id: string;
  mailboxAddressId: string;
  messageId: string;
  inReplyTo: string | null;
  references: string | null;
  threadKey: string;
  fromAddress: string;
  fromName: string | null;
  subject: string;
  bodyText: string;
  bodyHtml: string | null;
  receivedAt: Date;
}

// Email with per-user state — used in list and getById responses
export interface EmailWithState extends Email {
  isRead: boolean;
  isSaved: boolean;
  isTrashed: boolean;
  mailboxAddress: Pick<MailboxAddress, "address" | "displayName">;
}

// A thread groups emails sharing the same threadKey (normalised subject)
export interface EmailThread {
  threadKey: string;
  subject: string;
  emails: EmailWithState[]; // chronological (oldest first)
  latestEmail: EmailWithState;
  hasUnread: boolean;
  isSaved: boolean;
  isTrashed: boolean;
  messageCount: number;
}

// User actions on an email
export const EmailActionSchema = z.object({
  action: z.enum(["read", "unread", "save", "unsave", "trash", "restore"]),
});
export type EmailAction = z.infer<typeof EmailActionSchema>;

// Cloudflare inbound email webhook payload
export const InboundEmailSchema = z.object({
  messageId: z.string().min(1),
  from: z.object({
    address: z.string().email(),
    name: z.string().optional(),
  }),
  to: z.array(z.object({ address: z.string().email() })).min(1),
  subject: z.string().optional(),
  text: z.string().optional(),
  html: z.string().optional(),
  inReplyTo: z.string().optional(),
  references: z.string().optional(),
});
export type InboundEmailPayload = z.infer<typeof InboundEmailSchema>;

export interface EmailJob extends BaseEntity {
  to: string;
  cc: string | null;
  bcc: string | null;
  subject: string;
  bodyText: string;
  bodyHtml: string | null;
  fromAddress: string | null;
  status: "PENDING" | "PROCESSING" | "SENT" | "FAILED";
  priority: number;
  attempts: number;
  error: string | null;
  processedAt: Date | null;
}
