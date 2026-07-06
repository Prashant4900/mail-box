import { type NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { apiError } from "@/lib/api-response";
import { AUTH_CONFIG } from "@/lib/auth";
import { DraftService } from "@/services/draft.service";
import { SessionService } from "@/services/session.service";

const AttachmentSchema = z.object({
  filename: z.string(),
  content: z.string(),
  contentType: z.string(),
});

const UpdateDraftSchema = z.object({
  mailboxAddressId: z.string().optional().nullable(),
  to: z.string().optional().nullable(),
  cc: z.string().optional().nullable(),
  bcc: z.string().optional().nullable(),
  subject: z.string().optional().nullable(),
  bodyText: z.string().optional().nullable(),
  bodyHtml: z.string().optional().nullable(),
  attachments: z.array(AttachmentSchema).optional().nullable(),
});

export async function GET(
  req: NextRequest,
  props: { params: Promise<{ id: string }> },
) {
  try {
    const params = await props.params;
    const sessionToken = req.cookies.get(AUTH_CONFIG.session.cookieName)?.value;
    if (!sessionToken) return apiError("Not authenticated", 401);

    const sessionData = await SessionService.getSessionAndUser(sessionToken);
    if (!sessionData) return apiError("Session expired", 401);

    const user = sessionData.user;

    const draft = await DraftService.getDraft(user.id, params.id);
    return NextResponse.json(draft);
  } catch (error: unknown) {
    console.error("Failed to get draft:", error);
    return new NextResponse(
      error instanceof Error ? error.message : "Internal Server Error",
      {
        status: 500,
      },
    );
  }
}

export async function PATCH(
  req: NextRequest,
  props: { params: Promise<{ id: string }> },
) {
  try {
    const params = await props.params;
    const sessionToken = req.cookies.get(AUTH_CONFIG.session.cookieName)?.value;
    if (!sessionToken) return apiError("Not authenticated", 401);

    const sessionData = await SessionService.getSessionAndUser(sessionToken);
    if (!sessionData) return apiError("Session expired", 401);

    const user = sessionData.user;

    const json = await req.json();
    const data = UpdateDraftSchema.parse(json);

    const { attachments, ...draftData } = data;
    const draft = await DraftService.updateDraft(user.id, params.id, {
      ...draftData,
      attachmentsJson: attachments ? JSON.stringify(attachments) : undefined,
    });
    return NextResponse.json(draft);
  } catch (error: unknown) {
    console.error("Failed to update draft:", error);
    if (error instanceof z.ZodError) {
      return new NextResponse("Invalid request data", { status: 400 });
    }
    return new NextResponse(
      error instanceof Error ? error.message : "Internal Server Error",
      {
        status: 500,
      },
    );
  }
}

export async function DELETE(
  req: NextRequest,
  props: { params: Promise<{ id: string }> },
) {
  try {
    const params = await props.params;
    const sessionToken = req.cookies.get(AUTH_CONFIG.session.cookieName)?.value;
    if (!sessionToken) return apiError("Not authenticated", 401);

    const sessionData = await SessionService.getSessionAndUser(sessionToken);
    if (!sessionData) return apiError("Session expired", 401);

    const user = sessionData.user;

    await DraftService.deleteDraft(user.id, params.id);
    return new NextResponse(null, { status: 204 });
  } catch (error: unknown) {
    console.error("Failed to delete draft:", error);
    return new NextResponse(
      error instanceof Error ? error.message : "Internal Server Error",
      {
        status: 500,
      },
    );
  }
}
