# 🔌 API Reference

All API routes are served from `/api/` and return JSON. There are two authentication models:

- **Session Auth** — Cookie-based. The `auth_session` cookie must be present (set automatically after login). Used by all UI-facing endpoints.
- **Webhook Auth** — Header-based. The `x-webhook-secret` header must match the `WEBHOOK_SECRET` env variable. Used only by the Cloudflare Worker inbound endpoint.

Responses follow a consistent envelope format:

```json
// Success
{ "success": true, "data": { ... } }

// Error
{ "success": false, "error": "Error message" }
```

---

## Authentication

### `POST /api/auth/login`
Log in with email and password. Sets the `auth_session` cookie on success.

**Body:**
```json
{ "email": "user@example.com", "password": "yourpassword" }
```

### `POST /api/auth/logout`
Clears the session cookie and invalidates the server-side session.

### `GET /api/auth/me`
Returns the currently authenticated user's profile.

### `POST /api/auth/forgot-password`
Triggers a password reset email. Always returns success (see [Users & Access](Users-and-Access) for why).

**Body:** `{ "email": "user@example.com" }`

### `POST /api/auth/reset-password`
Resets the password using a valid token from the reset email.

**Body:** `{ "token": "<reset-token>", "password": "newpassword" }`

### `GET /api/auth/invite/validate?token=<token>`
Validates an invite token before the user sets a password.

### `POST /api/auth/invite/accept`
Accepts an invitation and sets the user's password.

**Body:** `{ "token": "<invite-token>", "password": "newpassword" }`

---

## Emails

### `POST /api/emails` — Inbound Webhook
**Auth:** `x-webhook-secret` header  
Called by the Cloudflare Worker when an inbound email arrives. Accepts a parsed MIME payload and stores it in the database.

**Body:**
```json
{
  "messageId": "<unique-message-id>",
  "from": { "address": "sender@example.com", "name": "Sender Name" },
  "to": [{ "address": "support@yourcompany.com" }],
  "subject": "Hello",
  "text": "Plain text body",
  "html": "<p>HTML body</p>"
}
```

### `GET /api/emails` — List Emails
**Auth:** Session  
Returns a paginated list of emails. Results are filtered by the user's mailbox access.

**Query params:**

| Param | Type | Default | Description |
|-------|------|---------|-------------|
| `page` | number | `1` | Page number |
| `limit` | number | `20` | Results per page (max 100) |
| `search` | string | — | Full-text search across subject and body |
| `trashed` | boolean | `false` | Return trashed emails only |
| `starred` | boolean | `false` | Return starred emails only |

### `GET /api/emails/[id]` — Get Single Email
**Auth:** Session  
Returns a single email by ID. Respects mailbox access control.

### `PATCH /api/emails/[id]` — Update Email State
**Auth:** Session  
Updates the state of an email for the current user.

**Body:** `{ "action": "read" | "unread" | "save" | "unsave" | "trash" | "restore" }`

### `DELETE /api/emails/[id]` — Hard Delete
**Auth:** Session  
Permanently deletes an email. The email must be in the trash first.

### `GET /api/emails/sent` — List Sent Emails
**Auth:** Session  
Returns sent email jobs from the queue, ordered by creation date.

### `POST /api/emails/send` — Send an Email
**Auth:** Session  
Validates sender mailbox access, then enqueues the email as a background job.

**Body:**
```json
{
  "fromId": "<mailbox-address-id>",
  "to": "recipient@example.com",
  "cc": "cc@example.com",
  "bcc": "bcc@example.com",
  "subject": "Subject",
  "bodyText": "Plain text",
  "bodyHtml": "<p>HTML</p>",
  "attachments": [{ "filename": "file.pdf", "content": "<base64>", "contentType": "application/pdf" }]
}
```

---

## Drafts

### `GET /api/emails/drafts`
**Auth:** Session  
Returns all drafts for the current user, grouped as threads.

### `POST /api/emails/drafts`
**Auth:** Session  
Creates a new draft. All fields are optional — a draft can be empty.

**Body:**
```json
{
  "mailboxAddressId": "<id>",
  "to": "recipient@example.com",
  "subject": "Draft subject",
  "bodyText": "Plain text",
  "bodyHtml": "<p>HTML</p>"
}
```

### `GET /api/emails/drafts/[id]`
**Auth:** Session — Returns a single draft by ID.

### `PUT /api/emails/drafts/[id]`
**Auth:** Session — Updates an existing draft.

### `DELETE /api/emails/drafts/[id]`
**Auth:** Session — Permanently deletes a draft.

---

## Threads

### `GET /api/threads`
**Auth:** Session  
Returns all inbound emails grouped into conversation threads, sorted by latest message. Supports `starred` and `trashed` query params.

---

## Mailbox Addresses

### `GET /api/mailbox-addresses`
**Auth:** Session — Returns all mailbox addresses.

### `POST /api/mailbox-addresses`
**Auth:** Session (Owner/Admin) — Creates a new mailbox address and registers it with Cloudflare.

**Body:** `{ "address": "support@yourcompany.com", "displayName": "Support" }`

### `DELETE /api/mailbox-addresses/[id]`
**Auth:** Session (Owner/Admin) — Deactivates and removes a mailbox address.

---

## Users

### `GET /api/users`
**Auth:** Session (Owner/Admin) — Returns all users with their pending invite status.

### `POST /api/users`
**Auth:** Session (Owner/Admin) — Creates a new user and sends an invite email.

### `PATCH /api/users/[id]`
**Auth:** Session (Owner/Admin) — Updates a user's profile, role, or mailbox access.

### `DELETE /api/users/[id]`
**Auth:** Session (Owner) — Permanently deletes a user. Cannot delete the Owner.

---

## User (Self)

### `GET /api/user/profile`
**Auth:** Session — Returns the current user's profile.

### `PATCH /api/user/profile`
**Auth:** Session — Updates the current user's name and email.

### `POST /api/user/change-password`
**Auth:** Session — Changes the current user's password.

**Body:** `{ "currentPassword": "old", "newPassword": "new" }`

---

## Settings

### `POST /api/settings/cloudflare/setup`
**Auth:** Session (Owner) — Links a Cloudflare domain by deploying the Worker and routing rules. The token is used immediately and never stored.

### `POST /api/settings/cloudflare/delink`
**Auth:** Session (Owner) — Removes the Cloudflare Worker and routing rules.

---

## System

### `GET /api/setup/status`
Returns whether the initial setup has been completed (i.e., if an Owner account exists). Used to gate the setup wizard.

### `POST /api/setup`
Creates the initial Owner account. Only works if no Owner exists yet.

### `GET /api/system/db-info`
**Auth:** Session (Owner) — Returns the active database engine and connection info for diagnostics.
