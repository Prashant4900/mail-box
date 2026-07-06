import type { NextRequest } from "next/server";
import { apiError, apiSuccess } from "@/lib/api-response";
import { AUTH_CONFIG } from "@/lib/auth";
import { SessionService } from "@/services/session.service";

export async function POST(req: NextRequest) {
  try {
    const sessionToken = req.cookies.get(AUTH_CONFIG.session.cookieName)?.value;

    if (sessionToken) {
      // Delete session from database
      await SessionService.deleteSession(sessionToken);
    }

    const response = apiSuccess({ success: true }, 200);

    // Clear cookie
    response.cookies.delete(AUTH_CONFIG.session.cookieName);

    return response;
  } catch (error) {
    const message = error instanceof Error ? error.message : "Logout failed";
    return apiError(message, 500);
  }
}
