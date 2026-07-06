import PostalMime from "postal-mime";

export interface Env {
  NEXTJS_APP_URL: string;
  WEBHOOK_SECRET: string;
}

export interface EmailMessage {
  readonly from: string;
  readonly to: string;
  readonly headers: Headers;
  readonly raw: ReadableStream;
  forward(to: string, headers?: Headers): Promise<void>;
  setReject(reason: string): void;
}

export default {
  async email(
    message: EmailMessage,
    env: Env,
    _ctx: ExecutionContext,
  ): Promise<void> {
    try {
      if (!env.NEXTJS_APP_URL || !env.WEBHOOK_SECRET) {
        throw new Error(
          "Missing required environment variables NEXTJS_APP_URL or WEBHOOK_SECRET",
        );
      }

      // Read raw email message stream as an arrayBuffer
      const rawEmail = await new Response(message.raw).arrayBuffer();

      // Parse email with postal-mime
      const parser = new PostalMime();
      const parsed = await parser.parse(rawEmail);

      // Extract message ID (fallback to header or generated random ID)
      const messageId =
        parsed.messageId ||
        message.headers.get("message-id") ||
        `${Date.now()}-${crypto.randomUUID()}@email.routing`;

      // Extract to address list (fallback to message.to)
      let toAddresses =
        (parsed.to?.map((t) => t.address).filter(Boolean) as string[]) || [];
      if (toAddresses.length === 0) {
        toAddresses = [message.to];
      }

      // Build JSON payload matching Next.js InboundEmailSchema
      const payload = {
        messageId,
        from: {
          address: parsed.from?.address || message.from,
          name: parsed.from?.name || undefined,
        },
        to: toAddresses.map((address) => ({ address })),
        subject: parsed.subject || "(no subject)",
        text: parsed.text || "",
        html: parsed.html || null,
      };

      // POST to Next.js webhook API endpoint
      const baseUrl = env.NEXTJS_APP_URL.replace(/\/$/, "");
      const webhookUrl = `${baseUrl}/api/emails`;

      const response = await fetch(webhookUrl, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "x-webhook-secret": env.WEBHOOK_SECRET,
        },
        body: JSON.stringify(payload),
      });

      if (!response.ok) {
        const errorText = await response.text();
        const rejectMsg = `Webhook forward failed (Status: ${response.status}): ${errorText}`;
        message.setReject(rejectMsg);
        throw new Error(rejectMsg);
      }
    } catch (error) {
      console.error("Error handling incoming email:", error);
      // Re-throw so Cloudflare triggers a temporary failure/retry or bounce
      throw error;
    }
  },
};
