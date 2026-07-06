import type { NextRequest } from "next/server";
import { apiError, apiSuccess } from "@/lib/api-response";
import { AUTH_CONFIG } from "@/lib/auth";
import { MailboxAddressService } from "@/services/mailbox-address.service";
import { SessionService } from "@/services/session.service";

// ── PATCH /api/mailbox-addresses/[id] ────────────────────────────────────
// Private — requires OWNER or ADMIN role.
export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const { id } = await params;
    const sessionToken = req.cookies.get(AUTH_CONFIG.session.cookieName)?.value;
    if (!sessionToken) return apiError("Not authenticated", 401);

    const sessionData = await SessionService.getSessionAndUser(sessionToken);
    if (!sessionData) return apiError("Session expired", 401);

    const userRole = sessionData.user.role;
    if (userRole !== "OWNER" && userRole !== "ADMIN") {
      return apiError(
        "You do not have permission to update mailbox addresses",
        403,
      );
    }

    const payload = await req.json();
    const updateData: {
      address?: string;
      displayName?: string;
      isActive?: boolean;
    } = {};

    if (payload.address !== undefined) {
      updateData.address = payload.address?.trim();
    }
    if (payload.displayName !== undefined) {
      updateData.displayName = payload.displayName?.trim() || null;
    }
    if (payload.isActive !== undefined) {
      updateData.isActive = !!payload.isActive;
    }

    const mailbox = await MailboxAddressService.update(
      userRole,
      id,
      updateData,
    );

    return apiSuccess({ mailbox }, 200);
  } catch (error) {
    const message =
      error instanceof Error
        ? error.message
        : "Failed to update mailbox address";
    return apiError(message, 400);
  }
}

// ── DELETE /api/mailbox-addresses/[id] ───────────────────────────────────
// Private — OWNER performs hard delete, ADMIN performs soft delete.
export async function DELETE(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const { id } = await params;
    const sessionToken = req.cookies.get(AUTH_CONFIG.session.cookieName)?.value;
    if (!sessionToken) return apiError("Not authenticated", 401);

    const sessionData = await SessionService.getSessionAndUser(sessionToken);
    if (!sessionData) return apiError("Session expired", 401);

    const userRole = sessionData.user.role;
    if (userRole !== "OWNER" && userRole !== "ADMIN") {
      return apiError(
        "You do not have permission to delete mailbox addresses",
        403,
      );
    }

    await MailboxAddressService.delete(userRole, id);

    return apiSuccess(
      {
        success: true,
        deleted: true,
        mode: userRole === "OWNER" ? "hard" : "soft",
      },
      200,
    );
  } catch (error) {
    const message =
      error instanceof Error
        ? error.message
        : "Failed to delete mailbox address";
    return apiError(message, 400);
  }
}
