import bcrypt from "bcryptjs";
import { AUTH_CONFIG } from "@/lib/auth";
import { TemplateParser } from "@/lib/template-parser";
import { UserRepository } from "@/repositories/user.repository";
import { MailQueueService } from "@/services/mail-queue.service";
import { TokenService } from "@/services/token.service";
import type { UserRegistrationInput } from "@/types";

export const AuthService = {
  async registerUser(input: UserRegistrationInput) {
    const existingUser = await UserRepository.findUserByEmail(input.email);
    if (existingUser) {
      throw new Error("A user with this email already exists");
    }

    // Check if there is an owner
    const ownerCount = await UserRepository.countOwners();

    // The very first user defaults to OWNER. Everyone else is a MEMBER by default.
    let role = "MEMBER";
    if (ownerCount === 0) {
      role = "OWNER";
    }

    const salt = await bcrypt.genSalt(AUTH_CONFIG.security.bcryptSaltRounds);
    const passwordHash = await bcrypt.hash(input.password, salt);

    const newUser = await UserRepository.createUser({
      firstName: input.firstName,
      lastName: input.lastName,
      email: input.email,
      passwordHash,
      profileImage: input.profileImage || null,
      role,
    });

    // Strip password hash from return object
    const { passwordHash: _, ...safeUser } = newUser;
    return safeUser;
  },

  async authenticateUser(email: string, passwordPlain: string) {
    const user = await UserRepository.findUserByEmail(email);
    if (!user) {
      throw new Error("Invalid email or password");
    }

    if (user.isBanned) {
      throw new Error("Your account has been banned");
    }

    const isValid = await bcrypt.compare(passwordPlain, user.passwordHash);
    if (!isValid) {
      throw new Error("Invalid email or password");
    }

    const { passwordHash: _, ...safeUser } = user;
    return safeUser;
  },

  async requestPasswordReset(email: string) {
    const user = await UserRepository.findUserByEmail(email);
    if (!user) {
      // Security practice: do not leak whether account exists
      return null;
    }

    const token = await TokenService.generateResetToken(email);

    // Get the base URL from env or default to localhost
    const appUrl = process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000";
    const resetLink = `${appUrl}/reset-password?token=${token}`;

    const { html: htmlContent, text: textContent } = await TemplateParser.parse(
      "password-reset.html",
      {
        resetLink,
      },
    );

    await MailQueueService.enqueue({
      to: email,
      subject: "Password Reset Request",
      text: textContent,
      html: htmlContent,
      priority: "HIGH",
    });

    return token;
  },

  async resetPassword(tokenString: string, passwordPlain: string) {
    const tokenRecord = await TokenService.verifyResetToken(tokenString);
    const email = tokenRecord.identifier.replace("reset:", "");

    const user = await UserRepository.findUserByEmail(email);
    if (!user) {
      throw new Error("User not found");
    }

    const salt = await bcrypt.genSalt(AUTH_CONFIG.security.bcryptSaltRounds);
    const passwordHash = await bcrypt.hash(passwordPlain, salt);

    await UserRepository.updatePassword(user.id, passwordHash);
    await TokenService.deleteToken(tokenString);

    return true;
  },

  async changePassword(
    userId: string,
    currentPasswordPlain: string,
    newPasswordPlain: string,
  ) {
    if (!newPasswordPlain || newPasswordPlain.length < 8) {
      throw new Error("New password must be at least 8 characters long");
    }

    const user = await UserRepository.findUserById(userId);
    if (!user) {
      throw new Error("User not found");
    }

    const isValid = await bcrypt.compare(
      currentPasswordPlain,
      user.passwordHash,
    );
    if (!isValid) {
      throw new Error("Incorrect current password");
    }

    const salt = await bcrypt.genSalt(AUTH_CONFIG.security.bcryptSaltRounds);
    const passwordHash = await bcrypt.hash(newPasswordPlain, salt);

    await UserRepository.updatePassword(userId, passwordHash);
    return true;
  },
};
