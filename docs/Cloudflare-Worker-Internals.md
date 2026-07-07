# ⚙️ Cloudflare Worker Internals

This page explains what the Cloudflare Worker script actually does under the hood — what code runs inside Cloudflare's edge network and how it bridges raw incoming email to your Mailbox application.

---

## Overview

When Mailbox links your domain, it deploys a small Worker script to Cloudflare's edge. This Worker is the first thing that runs when someone sends an email to your domain. It acts as an **email-to-HTTP bridge**.

```
Incoming email (MIME format)
         │
         ▼
Cloudflare Email Routing
         │  matches routing rule for @yourcompany.com
         ▼
Cloudflare Worker (runs at the edge)
         │  1. Reads raw MIME stream
         │  2. Parses it with postal-mime
         │  3. Builds a JSON payload
         │  4. POSTs to your Mailbox webhook
         ▼
POST /api/emails  (your Next.js server)
```

---

## What the Worker Does — Step by Step

The Worker's source is located at [`cloudflare-worker/src/index.ts`](../cloudflare-worker/src/index.ts).

### 1. Receives the Raw Email Stream
Cloudflare calls the Worker's `email()` handler with a raw `ReadableStream` of the MIME-encoded email message.

```ts
async email(message: EmailMessage, env: Env, _ctx: ExecutionContext)
```

### 2. Reads and Parses the MIME Payload
The raw stream is converted to an `ArrayBuffer` and fed into **[postal-mime](https://github.com/postalsys/postal-mime)** — a lightweight MIME parser that extracts structured data from the raw email.

```ts
const rawEmail = await new Response(message.raw).arrayBuffer();
const parser = new PostalMime();
const parsed = await parser.parse(rawEmail);
```

It extracts:
- `from` — sender address and display name
- `to` — list of recipient addresses
- `subject` — email subject line
- `text` — plain-text body
- `html` — HTML body (if present)
- `messageId` — unique identifier for deduplication

### 3. Builds the JSON Payload
The parsed data is assembled into a structured JSON object that matches the `InboundEmailSchema` expected by the Mailbox webhook:

```ts
const payload = {
  messageId,
  from: { address: parsed.from?.address, name: parsed.from?.name },
  to: toAddresses.map((address) => ({ address })),
  subject: parsed.subject || "(no subject)",
  text: parsed.text || "",
  html: parsed.html || null,
};
```

### 4. POSTs to Your Mailbox Webhook
The payload is sent via `fetch()` to your application's `/api/emails` endpoint. The `WEBHOOK_SECRET` is included as a header so the Next.js server can verify the request is legitimate and not from an unknown source.

```ts
await fetch(`${env.NEXTJS_APP_URL}/api/emails`, {
  method: "POST",
  headers: {
    "Content-Type": "application/json",
    "x-webhook-secret": env.WEBHOOK_SECRET,
  },
  body: JSON.stringify(payload),
});
```

### 5. Handles Failures
If the webhook call fails (non-2xx response), the Worker calls `message.setReject()` which tells Cloudflare to treat the delivery as failed. Depending on the sender's mail server, this will either trigger a retry or bounce the email back to the sender with an error.

---

## Worker Environment Variables

The Worker needs two environment variables configured in Cloudflare (set automatically when you link your domain through Mailbox Settings):

| Variable | Description |
|----------|-------------|
| `NEXTJS_APP_URL` | Your public Mailbox app URL (e.g. `https://mail.yourcompany.com`) |
| `WEBHOOK_SECRET` | Must match the `WEBHOOK_SECRET` in your Next.js `.env` |

> [!IMPORTANT]
> The `WEBHOOK_SECRET` acts as the security bridge between Cloudflare and your server. Anyone who knows this secret could POST fake emails to your webhook. Keep it secret, keep it long (use `openssl rand -hex 32`), and never expose it publicly.

---

## Why This Architecture?

Cloudflare Email Routing can only forward incoming emails to either another email address or a **Worker script**. It cannot POST directly to an HTTP endpoint. The Worker bridges this gap — it receives the raw email, parses the MIME format, and converts it into a structured HTTP call your Next.js server can understand.

This means:
- **No email server is needed** on your infrastructure — Cloudflare handles reception.
- **Your Next.js server only receives clean JSON** — no MIME parsing in the application code.
- **Security is enforced at two layers** — Cloudflare's routing rules (only your domain) + the `WEBHOOK_SECRET` header.

---

## Modifying the Worker

The Worker source is a standalone project inside `cloudflare-worker/`. If you need to customize the routing logic (e.g. add filtering, strip attachments, or log metadata), you can edit `cloudflare-worker/src/index.ts` and redeploy using Wrangler:

```bash
cd cloudflare-worker
npm install
npx wrangler deploy
```

> [!NOTE]
> If you redeploy the Worker manually, make sure the `NEXTJS_APP_URL` and `WEBHOOK_SECRET` secrets are correctly set in your Cloudflare Worker's environment settings, as Wrangler will not carry them over automatically from your local `.env`.
