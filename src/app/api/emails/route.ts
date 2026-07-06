import type { NextRequest } from "next/server";
import { apiError, apiSuccess } from "@/lib/api-response";
import { AUTH_CONFIG } from "@/lib/auth";
import { API_EMAIL_LIMIT } from "@/lib/constants";
import { EmailService } from "@/services/email.service";
import { SessionService } from "@/services/session.service";

// ── POST /api/emails ──────────────────────────────────────────────────────
// Public — called by Cloudflare Email Routing when an email arrives.
// Authenticated via WEBHOOK_SECRET header, not a user session.
export async function POST(req: NextRequest) {
  try {
    const secret = req.headers.get("x-webhook-secret");
    if (!secret || secret !== process.env.WEBHOOK_SECRET) {
      return apiError("Unauthorized", 401);
    }

    const payload = await req.json();
    const email = await EmailService.processInbound(payload);

    return apiSuccess({ email }, 201);
  } catch (error) {
    const message =
      error instanceof Error ? error.message : "Failed to process email";
    return apiError(message, 400);
  }
}

// ── GET /api/emails ───────────────────────────────────────────────────────
// Private — requires a valid session.
// Query params: search, page, limit, trashed
export async function GET(req: NextRequest) {
  try {
    const sessionToken = req.cookies.get(AUTH_CONFIG.session.cookieName)?.value;
    if (!sessionToken) return apiError("Not authenticated", 401);

    const sessionData = await SessionService.getSessionAndUser(sessionToken);
    if (!sessionData) return apiError("Session expired", 401);

    const { searchParams } = new URL(req.url);
    const search = searchParams.get("search") ?? undefined;
    const page = Number(searchParams.get("page") ?? 1);
    const limit = Math.min(
      Number(searchParams.get("limit") ?? API_EMAIL_LIMIT),
      100,
    );
    const trashed = searchParams.get("trashed") === "true";
    const starred = searchParams.get("starred") === "true";

    const result = await EmailService.list(sessionData.user.id, {
      search,
      page,
      limit,
      trashed,
      starred,
    });

    return apiSuccess(result);
  } catch (error) {
    const message =
      error instanceof Error ? error.message : "Failed to fetch emails";
    return apiError(message, 500);
  }
}
