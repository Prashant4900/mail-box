# ☁️ Cloudflare Email Routing Setup

Mailbox integrates directly with Cloudflare's Email Routing engine to programmatically manage incoming mailbox addresses on your custom domain.

---

## How It Works

```
External Sender
      │  sends email to support@yourcompany.com
      ▼
Cloudflare Email Routing
      │  matches routing rule for @yourcompany.com
      ▼
Cloudflare Worker Script (auto-deployed by Mailbox)
      │  HTTP POST with MIME payload
      ▼
Mailbox Webhook: /api/emails/incoming
      │  parsed, validated, persisted
      ▼
Dashboard shows the email in real-time ✅
```

> [!NOTE]
> **Receiving vs Sending:** The Cloudflare integration is strictly for **receiving** inbound emails. To **send** emails (replies, outbound), configure your SMTP credentials separately in the `.env` file.

---

## Prerequisites

- A domain added and **active** on Cloudflare (orange cloud DNS).
- Email Routing must be **enabled** for the domain in your Cloudflare dashboard.
- Your Mailbox application must be **deployed to a public HTTPS URL** (cannot be localhost).

---

## Step 1 — Generate a Cloudflare API Token

1. Go to [Cloudflare Dashboard](https://dash.cloudflare.com) → **My Profile** → **API Tokens**.
2. Click **Create Token** → **Create Custom Token**.
3. Give it a name (e.g., `mailbox-token`).
4. Add the following permissions:

| Resource | Permission |
|----------|-----------|
| Zone — Zone Settings | Edit |
| Zone — Email Routing | Edit |
| Zone — Workers Scripts | Edit |

5. Under **Zone Resources**, select **Specific Zone** → choose your domain.
6. Click **Continue to summary** → **Create Token**.
7. **Copy the token immediately** — it is only shown once.

---

## Step 2 — Link Your Domain in Mailbox

1. Log in to your Mailbox dashboard as an **Admin** or **Owner**.
2. Navigate to **Settings** → **Cloudflare Integration**.
3. Fill in:
   - **API Token** — paste the token from Step 1.
   - **Zone / Domain** — select or type your domain (e.g., `yourcompany.com`).
   - **Webhook URL** — your public application URL (e.g., `https://mail.yourcompany.com`).
4. Click **Link Domain**.

Mailbox will automatically:
- Write a Cloudflare Worker script to forward MIME payloads to your webhook.
- Create the catch-all email routing rule for `*@yourcompany.com`.

---

## Step 3 — Add Mailbox Addresses

Once the domain is linked:

1. Go to **Settings** → **Mailbox Addresses**.
2. Click **Add Address**.
3. Enter the address prefix (e.g., `support`, `sales`, `hello`).
4. Mailbox creates the routing rule in Cloudflare automatically.

Now any email sent to `support@yourcompany.com` will appear in the Mailbox dashboard.

---

## Delink / Remove Integration

To remove the Cloudflare integration:

1. Go to **Settings** → **Cloudflare Integration**.
2. Click **Delink Domain**.

This will remove the Worker script and routing rules from Cloudflare but will **not** delete your historical email data from the database.

---

## Troubleshooting

| Issue | Solution |
|-------|---------|
| Emails not arriving | Check Cloudflare Email Routing is enabled on the domain |
| Worker deploy fails | Verify the API Token has `Workers Scripts: Edit` permission |
| Invalid webhook URL | Ensure the URL is HTTPS and publicly accessible |
| `403` on webhook | Check that the webhook route is not behind auth middleware |
