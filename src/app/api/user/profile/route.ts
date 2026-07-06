import type { NextRequest } from "next/server";
import { apiError, apiSuccess } from "@/lib/api-response";
import { AUTH_CONFIG } from "@/lib/auth";
import { SessionService } from "@/services/session.service";
import { UserService } from "@/services/user.service";

export async function PUT(req: NextRequest) {
  try {
    const sessionToken = req.cookies.get(AUTH_CONFIG.session.cookieName)?.value;
    if (!sessionToken) {
      return apiError("Not authenticated", 401);
    }

    const sessionData = await SessionService.getSessionAndUser(sessionToken);
    if (!sessionData) {
      return apiError("Session expired", 401);
    }

    const { firstName, lastName, email } = await req.json();
    const updatedUser = await UserService.updateUserProfile(
      sessionData.user.id,
      {
        firstName,
        lastName,
        email,
      },
    );

    return apiSuccess({ user: updatedUser }, 200);
  } catch (error) {
    const message =
      error instanceof Error ? error.message : "Failed to update profile";
    return apiError(message, 400);
  }
}
