# 📤 SMTP & Outbound Email

This page explains how outbound email sending works in Mailbox — including how to configure SMTP, how the job queue processes emails, and how to integrate a third-party email API (e.g. Resend, Postmark) if you don't have an SMTP server.

---

## How Sending Works — The Job Queue Model

Mailbox does **not** send emails instantly when you hit the send button. Instead, it treats every outbound email as a **job** — persisting it to the database first, then processing it in the background. This design makes sending reliable and fault-tolerant.

### The Full Send Flow

```
User clicks Send in the UI
         │
         ▼
POST /api/emails/send  (Next.js Route)
         │
         ▼
email.service.ts  →  mailClient.sendMail()
         │
         ▼  (bypassQueue = false)
MailQueueService.enqueue()
         │  saves job to database
         ▼
emailJob table  →  status: PENDING  ✅ (user sees "Sent")
         │
         │  Background Worker wakes up (within 3 seconds)
         ▼
MailQueueService.processQueue()
         │  fetches up to 5 PENDING jobs ordered by priority desc
         ▼
MailJobRepository.lockJob()  →  status: PROCESSING  🔒 (atomic lock)
         │
         ▼
mailClient.sendMailSmtp()  (or custom provider)
         │
    ┌────┴────┐
    │         │
  Success   Failure
    │         │
    ▼         ▼
status: SENT  status: PENDING (retry, up to 3 attempts)
              After 3 failures → status: FAILED
```

### Job States

| Status | Meaning |
|--------|---------|
| `PENDING` | Job is queued and waiting to be picked up by the worker |
| `PROCESSING` | Worker has locked and is actively sending this job |
| `SENT` | Email was delivered successfully to the SMTP server |
| `FAILED` | All 3 send attempts failed — check your SMTP credentials |

### Job Priority

When enqueuing, you can set a priority to control the send order:

| Priority | Value | Use Case |
|----------|-------|---------|
| `HIGH` | 3 | Transactional emails (password resets, invites) |
| `DEFAULT` | 2 | Standard user replies and outbound emails |
| `LOW` | 1 | Bulk or campaign emails |

### Background Worker Lifecycle

- The worker starts automatically the first time any email is enqueued.
- It polls the `emailJob` table **every 3 seconds** and processes up to **5 jobs per cycle**.
- A separate prune interval runs **once daily** to delete `SENT` jobs older than **7 days** to keep the database clean.

---

## Option 1 — Configure SMTP (Recommended)

SMTP is the simplest and most reliable way to send email. Any SMTP provider works — Gmail, Zoho, Mailgun, AWS SES, or your own mail server.

### Primary SMTP (All emails)

Add the following to your `.env` file:

```env
SMTP_HOST=smtp.yourprovider.com
SMTP_PORT=587
SMTP_SECURE=false          # Set to true for port 465 (SSL)
SMTP_USER=you@yourdomain.com
SMTP_PASS=your-smtp-password
SMTP_FROM_NAME=Mailbox
```

### Campaign SMTP (Optional — for LOW priority emails)

If you want bulk/campaign emails to go through a separate provider (e.g. Mailgun for campaigns, AWS SES for transactional), configure a second SMTP channel:

```env
SMTP_CAMPAIGN_HOST=smtp.mailgun.org
SMTP_CAMPAIGN_PORT=587
SMTP_CAMPAIGN_SECURE=false
SMTP_CAMPAIGN_USER=campaigns@yourdomain.com
SMTP_CAMPAIGN_PASS=your-campaign-password
SMTP_CAMPAIGN_FROM_NAME=Your Company Updates
```

All emails enqueued with `priority: LOW` will automatically route to the campaign SMTP. All other priorities use the primary SMTP.

### Dry Run Mode (For Testing)

If you want to test the queue and send flow **without actually sending emails**, set:

```env
SMTP_DRY_RUN=true
```

Instead of dispatching to SMTP, the system will print the full email payload to the server console. Useful for local development and staging environments.

---

## Option 2 — Use a Third-Party Email API

If you don't have an SMTP server, you can integrate a transactional email API provider such as **Resend**, **Postmark**, or **SendGrid**. These APIs are often easier to set up and have generous free tiers.

> [!IMPORTANT]
> This requires writing a small amount of custom code. The system has a **blueprint placeholder** ready for you in `src/clients/mail.ts` — you just need to fill it in.

### Step 1 — Install the Provider SDK

For example, using [Resend](https://resend.com):

```bash
npm install resend
```

### Step 2 — Add Your API Key to `.env`

```env
EMAIL_PROVIDER=RESEND
RESEND_API_KEY=re_xxxxxxxxxxxxxxxxxxxx
```

### Step 3 — Implement `sendMailCustom` in `src/clients/mail.ts`

Open [`src/clients/mail.ts`](../src/clients/mail.ts) and find the `sendMailCustom` method. Replace the placeholder with your provider's SDK call:

```ts
// Example: Resend integration
async sendMailCustom(options: SendMailOptions) {
  const { Resend } = await import("resend");
  const resend = new Resend(process.env.RESEND_API_KEY);

  const { data, error } = await resend.emails.send({
    from: options.from || `Mailbox <noreply@yourdomain.com>`,
    to: options.to,
    cc: options.cc,
    bcc: options.bcc,
    subject: options.subject,
    text: options.text,
    html: options.html,
  });

  if (error) throw new Error(error.message);
  return data;
},
```

### Step 4 — Enable the Custom Provider in `sendMail`

In the same file, uncomment the provider routing block above the SMTP call:

```ts
// ── 2. CUSTOM PROVIDER ─────────────────────────────────────────────────────
if (process.env.EMAIL_PROVIDER === "RESEND") {
  return this.sendMailCustom(options);
}
```

That's it — the queue system, retry logic, priority routing, and prune intervals all continue to work exactly the same. Only the final delivery method changes.

---

## Fallback Behaviour

If SMTP is **not configured** and no custom provider is active, the system automatically falls back to **console logging** instead of throwing an error. This means your application will never crash due to a missing mail config — emails will just be printed to the server logs instead of delivered.

---

## Troubleshooting

| Issue | Solution |
|-------|---------|
| Emails stuck in `PENDING` | Check that the Next.js server process is running — the worker lives in the same process |
| `FAILED` status after 3 attempts | Verify `SMTP_HOST`, `SMTP_USER`, and `SMTP_PASS` are correct |
| Emails printing to console instead of sending | `SMTP_DRY_RUN=true` is set, or `SMTP_HOST` / `SMTP_USER` are missing from `.env` |
| `sendMailCustom not implemented` error | You enabled `EMAIL_PROVIDER` but haven't filled in the `sendMailCustom` method yet |
