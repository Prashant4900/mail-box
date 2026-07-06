import type { NextRequest } from "next/server";
import { apiError, apiSuccess } from "@/lib/api-response";
import { AUTH_CONFIG } from "@/lib/auth";
import { MailboxAddressRepository } from "@/repositories/mailbox-address.repository";
import { MailQueueService } from "@/services/mail-queue.service";
import { SessionService } from "@/services/session.service";

export async function POST(req: NextRequest) {
  try {
    const sessionToken = req.cookies.get(AUTH_CONFIG.session.cookieName)?.value;
    if (!sessionToken) return apiError("Not authenticated", 401);

    const sessionData = await SessionService.getSessionAndUser(sessionToken);
    if (!sessionData) return apiError("Session expired", 401);

    const body = await req.json();
    const { fromId, to, cc, bcc, subject, bodyText, bodyHtml, attachments } = body;

    if (!fromId || !to || !subject) {
      return apiError("Missing required fields", 400);
    }

    // Verify user has access to this mailbox address
    const { user } = sessionData;
    let hasAccess = false;
    if (user.role === "OWNER") {
      hasAccess = true;
    } else {
      hasAccess = user.mailboxAccess.some(
        (ma) => ma.mailboxAddressId === fromId,
      );
    }

    if (!hasAccess) {
      return apiError(
        "Forbidden: You do not have access to send from this address",
        403,
      );
    }

    const mailboxAddress = await MailboxAddressRepository.findById(fromId);
    if (!mailboxAddress || !mailboxAddress.isActive) {
      return apiError("Mailbox address not found or inactive", 404);
    }

    // Enqueue the outbound email
    const job = await MailQueueService.enqueue({
      to,
      cc,
      bcc,
      subject,
      text: bodyText || bodyHtml || "", // Text fallback
      html: bodyHtml,
      from: mailboxAddress.displayName
        ? `"${mailboxAddress.displayName}" <${mailboxAddress.address}>`
        : mailboxAddress.address,
      priority: "DEFAULT",
      attachments,
    });

    return apiSuccess({ job }, 201);
  } catch (error) {
    const message =
      error instanceof Error ? error.message : "Failed to queue email";
    return apiError(message, 500);
  }
}
