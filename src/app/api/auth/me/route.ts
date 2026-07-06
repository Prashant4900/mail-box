import type { NextRequest } from "next/server";
import { apiError, apiSuccess } from "@/lib/api-response";
import { AUTH_CONFIG } from "@/lib/auth";
import { SessionService } from "@/services/session.service";

export async function GET(req: NextRequest) {
  try {
    const sessionToken = req.cookies.get(AUTH_CONFIG.session.cookieName)?.value;

    if (!sessionToken) {
      return apiError("Not authenticated", 401);
    }

    const sessionData = await SessionService.getSessionAndUser(sessionToken);

    if (!sessionData) {
      // Token is invalid or expired
      const response = apiError("Session expired", 401);
      response.cookies.delete(AUTH_CONFIG.session.cookieName);
      return response;
    }

    return apiSuccess({ user: sessionData.user }, 200);
  } catch (_error) {
    return apiError("Internal server error", 500);
  }
}
