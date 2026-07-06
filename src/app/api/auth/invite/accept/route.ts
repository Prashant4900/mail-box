import bcrypt from "bcryptjs";
import type { NextRequest } from "next/server";
import { apiError, apiSuccess } from "@/lib/api-response";
import { AUTH_CONFIG } from "@/lib/auth";
import { UserRepository } from "@/repositories/user.repository";

export async function POST(req: NextRequest) {
  try {
    const { token, password } = await req.json();

    if (!token || !password) {
      return apiError("Token and password are required", 400);
    }

    if (password.length < 8) {
      return apiError("Password must be at least 8 characters long", 400);
    }

    const verificationToken = await UserRepository.findVerificationToken(token);
    if (!verificationToken) {
      return apiError(
        "Invalid or expired invitation token. Please request a new invite.",
        400,
      );
    }

    // Check expiration
    const isExpired = new Date() > verificationToken.expires;
    if (isExpired) {
      await UserRepository.deleteVerificationToken(token);
      return apiError("Invitation link has expired", 400);
    }

    // Find user by email (stored in identifier)
    const user = await UserRepository.findUserByEmail(
      verificationToken.identifier,
    );
    if (!user) {
      return apiError("User account not found", 404);
    }

    // Hash the password
    const salt = await bcrypt.genSalt(AUTH_CONFIG.security.bcryptSaltRounds);
    const passwordHash = await bcrypt.hash(password, salt);

    // Save password
    await UserRepository.updatePassword(user.id, passwordHash);

    // Consume the token
    await UserRepository.deleteVerificationToken(token);

    return apiSuccess({ success: true }, 200);
  } catch (error) {
    const message =
      error instanceof Error ? error.message : "Failed to accept invitation";
    return apiError(message, 500);
  }
}
