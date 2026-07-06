import type { NextRequest } from "next/server";
import { z } from "zod";
import { apiError, apiSuccess } from "@/lib/api-response";
import { AUTH_CONFIG } from "@/lib/auth";
import { EmailService } from "@/services/email.service";
import { SessionService } from "@/services/session.service";

const ActionSchema = z.object({
  action: z.enum(["read", "unread", "save", "unsave", "trash", "restore"]),
});

// ── GET /api/emails/[id] ──────────────────────────────────────────────────
export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const sessionToken = req.cookies.get(AUTH_CONFIG.session.cookieName)?.value;
    if (!sessionToken) return apiError("Not authenticated", 401);

    const sessionData = await SessionService.getSessionAndUser(sessionToken);
    if (!sessionData) return apiError("Session expired", 401);

    const { id } = await params;
    const email = await EmailService.getById(sessionData.user.id, id);

    return apiSuccess({ email });
  } catch (error) {
    const message =
      error instanceof Error ? error.message : "Failed to fetch email";
    const status = message === "Email not found" ? 404 : 500;
    return apiError(message, status);
  }
}

// ── PATCH /api/emails/[id] ────────────────────────────────────────────────
// Body: { action: "read" | "unread" | "save" | "unsave" | "trash" | "restore" }
export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const sessionToken = req.cookies.get(AUTH_CONFIG.session.cookieName)?.value;
    if (!sessionToken) return apiError("Not authenticated", 401);

    const sessionData = await SessionService.getSessionAndUser(sessionToken);
    if (!sessionData) return apiError("Session expired", 401);

    const body = await req.json();
    const parsed = ActionSchema.safeParse(body);
    if (!parsed.success) {
      return apiError(
        "Invalid action. Must be one of: read, unread, save, unsave, trash, restore",
        400,
      );
    }

    const { id } = await params;
    const result = await EmailService.updateState(
      sessionData.user.id,
      id,
      parsed.data.action,
    );

    return apiSuccess(result);
  } catch (error) {
    const message =
      error instanceof Error ? error.message : "Failed to update email";
    const status = message === "Email not found" ? 404 : 500;
    return apiError(message, status);
  }
}

// ── DELETE /api/emails/[id] ───────────────────────────────────────────────
// Hard-deletes the email permanently. Email must already be in the user's trash.
export async function DELETE(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const sessionToken = req.cookies.get(AUTH_CONFIG.session.cookieName)?.value;
    if (!sessionToken) return apiError("Not authenticated", 401);

    const sessionData = await SessionService.getSessionAndUser(sessionToken);
    if (!sessionData) return apiError("Session expired", 401);

    const { id } = await params;
    await EmailService.hardDelete(sessionData.user.id, id);

    return apiSuccess({ deleted: true });
  } catch (error) {
    const message =
      error instanceof Error ? error.message : "Failed to delete email";
    const status =
      message === "Email not found"
        ? 404
        : message.includes("must be in trash")
          ? 422
          : 500;
    return apiError(message, status);
  }
}
