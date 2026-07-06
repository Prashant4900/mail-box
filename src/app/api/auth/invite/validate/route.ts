import type { NextRequest } from "next/server";
import { apiError, apiSuccess } from "@/lib/api-response";
import { UserRepository } from "@/repositories/user.repository";

export const dynamic = "force-dynamic";

export async function GET(req: NextRequest) {
  try {
    const token = req.nextUrl.searchParams.get("token");
    if (!token) {
      return apiError("Invitation token is required", 400);
    }

    const verificationToken = await UserRepository.findVerificationToken(token);
    if (!verificationToken) {
      return apiError("Invalid invitation token", 400);
    }

    // Check expiration
    const isExpired = new Date() > verificationToken.expires;
    if (isExpired) {
      // Consume expired token
      await UserRepository.deleteVerificationToken(token);
      return apiError("Invitation has expired", 400);
    }

    return apiSuccess({ email: verificationToken.identifier }, 200);
  } catch (error) {
    const message =
      error instanceof Error ? error.message : "Validation failed";
    return apiError(message, 500);
  }
}
