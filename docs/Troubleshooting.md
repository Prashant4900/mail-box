# 🛠 Troubleshooting

This page covers the most common issues encountered when setting up, deploying, and running Mailbox.

---

## Setup & First Run

### The `/setup` page shows "Already Configured" or redirects away

The setup wizard is only accessible when **no Owner account exists**. If the page redirects or shows this message, an Owner was already created. Go directly to `/login` instead.

If you need to start fresh for development purposes, wipe your database:

```bash
rm dev.db          # SQLite
npm run db:push    # Recreate schema
```

---

## Database

### `PrismaClientInitializationError` on startup

Your `DATABASE_URL` is missing, incorrect, or pointing to a database that isn't running.

**Checklist:**
- Confirm `DATABASE_URL` is set in your `.env`.
- For Docker databases, verify containers are running: `npm run docker:up`.
- For Neon/Supabase, check the connection string is the **pooled** version (not the direct connection string).

### Schema is out of sync / missing tables

Run the schema sync commands:

```bash
npm run db:generate
npm run db:push     # For SQLite / serverless
npm run db:migrate  # For PostgreSQL / MySQL via Docker
```

### `db:migrate` fails with a connection pooler error (Neon/Supabase)

Serverless databases use a transaction pooler proxy that blocks Prisma migration lock tables. Use `db:push` instead:

```bash
npm run db:push
```

---

## Cloudflare & Inbound Email

### Emails are not appearing in the dashboard

Work through this checklist in order:

1. **Is Email Routing enabled?** Go to Cloudflare Dashboard → your domain → Email → Email Routing. It must show "Enabled".
2. **Is the domain linked in Mailbox?** Go to Settings → Cloudflare Integration. The domain should show as linked.
3. **Is your app publicly accessible?** The Cloudflare Worker needs to reach your webhook URL over the internet. `localhost` will not work.
4. **Is the Worker deployed?** In Cloudflare Dashboard → Workers & Pages, look for a Worker named `mailbox-*`. If it's missing, unlink and re-link the domain.
5. **Is `WEBHOOK_SECRET` matching?** The `WEBHOOK_SECRET` in your `.env` must exactly match the one configured in the Cloudflare Worker's environment variables.

### `403 Unauthorized` in the Worker logs

The `x-webhook-secret` header sent by the Worker does not match `WEBHOOK_SECRET` in your Next.js environment. Re-link the domain from Settings to re-sync the secret.

### `404` webhook errors in Cloudflare Worker logs

Your `NEXT_PUBLIC_APP_URL` is set incorrectly. It must be a valid HTTPS URL with no trailing slash (e.g. `https://mail.yourcompany.com`).

### Emails arrive in Cloudflare but bounce back to the sender

The Worker ran but your webhook returned an error. Check your Next.js server logs for the error from `/api/emails`. Common causes:
- No active mailbox address matching the recipient.
- Database is unreachable.

---

## Outbound Email & SMTP

### Emails are stuck in `PENDING` status forever

The background mail queue worker runs inside the Next.js server process. If the server restarts or the process crashes, the worker stops polling. Restarting the server will restart the worker.

On serverless platforms (Vercel), long-running background workers are not supported — consider using an external job queue or cron trigger for production sending.

### Emails are printing to the console instead of sending

One of two reasons:
- `SMTP_DRY_RUN=true` is set in your `.env`. Remove or set it to `false`.
- `SMTP_HOST` or `SMTP_USER` is missing. The system falls back to console mode automatically when SMTP is not configured.

### `FAILED` jobs after 3 attempts

Your SMTP credentials are wrong or your provider is rejecting the connection. Check:
- `SMTP_HOST`, `SMTP_PORT`, `SMTP_USER`, `SMTP_PASS` are all correct.
- `SMTP_SECURE=true` for port 465, `false` for port 587.
- Your SMTP provider allows the connection (some require app-specific passwords or whitelist IPs).

---

## Authentication

### Login fails with "Invalid email or password" even with correct credentials

- Double-check for leading/trailing spaces in the email or password field.
- The account may be **banned** (`isBanned: true`). Check the Users panel.
- If you just ran `db:push` or reset the database, the account no longer exists — complete the setup wizard again.

### Session expires immediately after login

`WEBHOOK_SECRET` (used for signing session tokens) may have changed between deploys. This invalidates all existing sessions. Users will need to log in again after a secret rotation — this is expected behaviour.

### Forgot password email is not arriving

- Check your SMTP configuration — if it's not set up, the email is only printed to the console.
- Check your spam/junk folder.
- The reset link expires in **1 hour** — request a new one if it has expired.

### Invite link shows "Invalid or expired token"

Invite tokens expire after **48 hours**. Ask an Admin to delete and re-create the user account to generate a fresh invite.

---

## Deployment

### Vercel build fails with Prisma errors

The `vercel-build` script (`prisma generate && prisma db push && next build`) requires `DATABASE_URL` to be set as a Vercel environment variable. Add it in the Vercel project settings before deploying.

### Docker container starts but the app is unreachable

- Check the container logs: `npm run docker:logs`
- Verify your Nginx reverse proxy config is pointing to the correct port (default: `3000`).
- Ensure your SSL certificate (Certbot) is valid and not expired.

### `ECONNREFUSED` errors in Docker logs

The Next.js app container is trying to connect to the database before it is ready. Wait ~10 seconds and check again — Docker Compose does not guarantee start order by health. If it persists, add a `healthcheck` to your `docker-compose.yml`.

---

## Still Stuck?

If none of the above resolves your issue:

1. Check the **server logs** for the full error stack trace.
2. Open `npm run db:studio` and inspect the database tables directly.
3. Open an issue on [GitHub](https://github.com/Prashant4900/mail-box/issues) with your error message and steps to reproduce.
