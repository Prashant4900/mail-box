import type { NextRequest } from "next/server";
import { apiError, apiSuccess } from "@/lib/api-response";
import { AUTH_CONFIG } from "@/lib/auth";
import { AuthService } from "@/services/auth.service";
import { SessionService } from "@/services/session.service";

export async function POST(req: NextRequest) {
  try {
    const sessionToken = req.cookies.get(AUTH_CONFIG.session.cookieName)?.value;
    if (!sessionToken) {
      return apiError("Not authenticated", 401);
    }

    const sessionData = await SessionService.getSessionAndUser(sessionToken);
    if (!sessionData) {
      return apiError("Session expired", 401);
    }

    const { currentPassword, newPassword } = await req.json();
    if (!currentPassword || !newPassword) {
      return apiError("Current password and new password are required", 400);
    }

    await AuthService.changePassword(
      sessionData.user.id,
      currentPassword,
      newPassword,
    );

    return apiSuccess({ success: true }, 200);
  } catch (error) {
    const message =
      error instanceof Error ? error.message : "Failed to change password";
    return apiError(message, 400);
  }
}
