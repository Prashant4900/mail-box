import crypto from "node:crypto";
import bcrypt from "bcryptjs";
import { mailClient } from "@/clients/mail";
import { AUTH_CONFIG } from "@/lib/auth";
import { TemplateParser } from "@/lib/template-parser";
import { UserRepository } from "@/repositories/user.repository";

export const UserService = {
  async fetchUserProfile(userId: string) {
    if (!userId) throw new Error("User ID is required");

    // Call Layer 1
    const user = await UserRepository.findUserById(userId);
    if (!user) throw new Error("User not found");

    // Perform any business logic / formatting here
    return {
      ...user,
      displayName: `${user.firstName} ${user.lastName}`.toUpperCase(),
    };
  },

  async updateUserProfile(
    userId: string,
    data: { firstName: string; lastName: string; email: string },
  ) {
    if (!userId) throw new Error("User ID is required");
    if (!data.firstName || !data.lastName || !data.email) {
      throw new Error("First name, last name, and email are required");
    }

    // Check if email already exists for another user
    const existingUser = await UserRepository.findUserByEmail(data.email);
    if (existingUser && existingUser.id !== userId) {
      throw new Error("Email is already taken");
    }

    return UserRepository.updateUser(userId, data);
  },

  async getAllUsers() {
    const users = await UserRepository.findAllUsers();
    const tokens = await UserRepository.findAllActiveVerificationTokens();
    const pendingEmails = new Set(tokens.map((t) => t.identifier));

    return users.map(({ passwordHash, ...safeUser }) => ({
      ...safeUser,
      isPendingConfirm: pendingEmails.has(safeUser.email),
    }));
  },

  async createUserByAdmin(data: {
    firstName: string;
    lastName: string;
    email: string;
    role: "OWNER" | "ADMIN" | "USER" | "MEMBER";
    isActive: boolean;
    mailboxAddressIds?: string[];
  }) {
    if (data.role === "OWNER") {
      throw new Error("Cannot create additional OWNER accounts");
    }

    const existingUser = await UserRepository.findUserByEmail(data.email);
    if (existingUser) {
      throw new Error("A user with this email already exists");
    }

    // Set a completely random and unguessable password hash for safety
    const tempPassword = crypto.randomUUID();
    const salt = await bcrypt.genSalt(AUTH_CONFIG.security.bcryptSaltRounds);
    const passwordHash = await bcrypt.hash(tempPassword, salt);

    const newUser = await UserRepository.createUser(
      {
        firstName: data.firstName,
        lastName: data.lastName,
        email: data.email,
        role: data.role,
        isActive: data.isActive,
        passwordHash,
      },
      data.mailboxAddressIds,
    );

    // Generate secure 32-byte invitation token
    const token = crypto.randomBytes(32).toString("hex");
    const expires = new Date();
    expires.setHours(expires.getHours() + 48); // 48 hours expiration

    await UserRepository.createVerificationToken(data.email, token, expires);

    // Queue the invitation email (High priority transactional)
    const appUrl = process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000";
    const inviteLink = `${appUrl}/accept-invite?token=${token}`;

    const { html: htmlContent, text: textContent } = await TemplateParser.parse(
      "invite-user.html",
      {
        firstName: data.firstName,
        role: data.role,
        inviteLink,
      },
    );

    await mailClient.sendMail({
      to: data.email,
      subject: "Invitation to join Mailbox",
      text: textContent,
      html: htmlContent,
      priority: "HIGH",
    });

    const { passwordHash: _, ...safeUser } = newUser;
    return safeUser;
  },

  async updateUserByAdmin(
    userId: string,
    data: {
      firstName?: string;
      lastName?: string;
      email?: string;
      role?: string;
      isActive?: boolean;
      isBanned?: boolean;
      mailboxAddressIds?: string[];
    },
  ) {
    if (!userId) throw new Error("User ID is required");

    if (data.role === "OWNER") {
      const user = await UserRepository.findUserById(userId);
      if (user?.role !== "OWNER") {
        throw new Error("Cannot assign the OWNER role to this account");
      }
    }

    if (data.email) {
      const existingUser = await UserRepository.findUserByEmail(data.email);
      if (existingUser && existingUser.id !== userId) {
        throw new Error("Email is already taken");
      }
    }

    const updatedUser = await UserRepository.updateUser(
      userId,
      {
        firstName: data.firstName,
        lastName: data.lastName,
        email: data.email,
        role: data.role,
        isActive: data.isActive,
        isBanned: data.isBanned,
      },
      data.mailboxAddressIds,
    );
    const { passwordHash: _, ...safeUser } = updatedUser;
    return safeUser;
  },

  async deleteUserByAdmin(userId: string) {
    if (!userId) throw new Error("User ID is required");
    const user = await UserRepository.findUserById(userId);
    if (!user) throw new Error("User not found");
    if (user.role === "OWNER") {
      throw new Error("Cannot delete the system owner account");
    }
    return UserRepository.deleteUser(userId);
  },
};
