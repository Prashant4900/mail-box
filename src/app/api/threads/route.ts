import type { NextRequest } from "next/server";
import { apiError, apiSuccess } from "@/lib/api-response";
import { AUTH_CONFIG } from "@/lib/auth";
import { EmailService } from "@/services/email.service";
import { SessionService } from "@/services/session.service";

// ── GET /api/threads ──────────────────────────────────────────────────────
// Returns all emails grouped into conversation threads.
// Query params: search, trashed, starred
export async function GET(req: NextRequest) {
  try {
    const sessionToken = req.cookies.get(AUTH_CONFIG.session.cookieName)?.value;
    if (!sessionToken) return apiError("Not authenticated", 401);

    const sessionData = await SessionService.getSessionAndUser(sessionToken);
    if (!sessionData) return apiError("Session expired", 401);

    const { searchParams } = new URL(req.url);
    const search = searchParams.get("search") ?? undefined;
    const trashed = searchParams.get("trashed") === "true";
    const starred = searchParams.get("starred") === "true";

    const threads = await EmailService.listThreads(sessionData.user.id, {
      search,
      trashed,
      starred,
    });

    return apiSuccess({ threads });
  } catch (error) {
    const message =
      error instanceof Error ? error.message : "Failed to fetch threads";
    return apiError(message, 500);
  }
}
