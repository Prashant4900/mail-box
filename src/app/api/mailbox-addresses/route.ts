import type { NextRequest } from "next/server";
import { apiError, apiSuccess } from "@/lib/api-response";
import { AUTH_CONFIG } from "@/lib/auth";
import { MailboxAddressService } from "@/services/mailbox-address.service";
import { SessionService } from "@/services/session.service";

// ── GET /api/mailbox-addresses ───────────────────────────────────────────
// Private — requires a valid session (accessible to OWNER, ADMIN, MEMBER).
export async function GET(req: NextRequest) {
  try {
    const sessionToken = req.cookies.get(AUTH_CONFIG.session.cookieName)?.value;
    if (!sessionToken) return apiError("Not authenticated", 401);

    const sessionData = await SessionService.getSessionAndUser(sessionToken);
    if (!sessionData) return apiError("Session expired", 401);

    const mailboxes = await MailboxAddressService.list();
    return apiSuccess({ mailboxes }, 200);
  } catch (error) {
    const message =
      error instanceof Error
        ? error.message
        : "Failed to fetch mailbox addresses";
    return apiError(message, 500);
  }
}

// ── POST /api/mailbox-addresses ──────────────────────────────────────────
// Private — requires OWNER or ADMIN role.
export async function POST(req: NextRequest) {
  try {
    const sessionToken = req.cookies.get(AUTH_CONFIG.session.cookieName)?.value;
    if (!sessionToken) return apiError("Not authenticated", 401);

    const sessionData = await SessionService.getSessionAndUser(sessionToken);
    if (!sessionData) return apiError("Session expired", 401);

    const userRole = sessionData.user.role;
    if (userRole !== "OWNER" && userRole !== "ADMIN") {
      return apiError(
        "You do not have permission to add mailbox addresses",
        403,
      );
    }

    const payload = await req.json();
    const address = payload.address?.trim();
    const displayName = payload.displayName?.trim() || null;
    const isActive = payload.isActive !== false; // defaults to true

    const mailbox = await MailboxAddressService.create(userRole, {
      address,
      displayName,
      isActive,
    });

    return apiSuccess({ mailbox }, 201);
  } catch (error) {
    const message =
      error instanceof Error
        ? error.message
        : "Failed to create mailbox address";
    return apiError(message, 400);
  }
}
