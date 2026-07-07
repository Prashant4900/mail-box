# 👥 Users & Access Control

This page explains how user accounts work in Mailbox — roles, permissions, the invitation flow, mailbox-level access, and account security policies.

---

## Role Hierarchy

Mailbox uses a three-tier role system. Roles are strictly hierarchical — higher roles include all permissions of roles below them.

```
OWNER  >  ADMIN  >  MEMBER
```

| Role | Who | Key Capabilities |
|------|-----|-----------------|
| `OWNER` | The person who ran the initial setup | Full system access. Cannot be deleted or demoted. Only one `OWNER` can exist. |
| `ADMIN` | Trusted team leads | Manage users, configure mailbox addresses, access all emails across all mailboxes |
| `MEMBER` | Regular team members | Can only read/reply to emails in mailboxes they have been explicitly granted access to |

> [!IMPORTANT]
> There can only be **one `OWNER`** account in the system. The `OWNER` role is assigned automatically to the very first user who completes the setup wizard. You cannot create or promote another user to `OWNER`.

---

## How the First User (Owner) is Created

The `OWNER` account is created during the **initial setup wizard** — not through the normal invite flow.

```
First visit to the app
        │
        ▼
/setup page (only accessible if no OWNER exists yet)
        │  Fill in name, email, password
        ▼
AuthService.registerUser()
        │  Checks: ownerCount === 0 → assigns role = "OWNER"
        ▼
Owner account created — setup wizard completes
        │
        ▼
Redirected to the dashboard ✅
```

After the first `OWNER` is created, the `/setup` page becomes inaccessible.

---

## How New Users Are Invited

Admins and Owners do not set passwords for new users. Instead, they create an invitation which sends a secure link to the new user's email.

### Invitation Flow

```
Admin clicks "Invite User" in the Users panel
        │  Provides: name, email, role, mailbox access
        ▼
UserService.createUserByAdmin()
        │
        ├─ Creates user account with a random unguessable temp password
        ├─ Generates a secure 32-byte invite token (expires in 48 hours)
        ├─ Stores token in the verificationToken table
        └─ Queues HIGH priority invitation email to the new user
                        │
                        ▼
New user receives email with a unique invite link:
/accept-invite?token=<secure-token>
                        │
                        ▼
User sets their own password → account activated ✅
```

> [!NOTE]
> If the new user does **not** accept the invite within **48 hours**, the token expires. The Admin must delete and re-create the user to generate a new invite link.

### Pending Invites

In the **Users** panel, any user who has been created but has not yet accepted their invite will show a **"Pending"** badge. This is determined by checking for an active (non-expired) verification token for their email address.

---

## Mailbox-Level Access Control

`MEMBER` role users do **not** have access to all incoming emails by default. They can only see emails delivered to mailbox addresses that an Admin has explicitly granted them access to.

### How it works

- When creating or editing a user, Admins select which mailbox addresses the user can access.
- This creates a record in the `UserMailboxAccess` join table linking `userId ↔ mailboxAddressId`.
- Every email list query checks the user's role:
  - `OWNER` / `ADMIN` → sees **all** emails across all mailboxes.
  - `MEMBER` → query is filtered to only their allowed `mailboxAddressIds`.

```
MEMBER logs in and opens inbox
        │
        ▼
EmailService.list(userId)
        │  user.role === "MEMBER"
        ▼
Fetches allowedMailboxIds from UserMailboxAccess
        │
        ▼
Prisma query filtered: WHERE mailboxAddressId IN [allowed IDs]
        │
        ▼
User only sees emails for their assigned mailboxes ✅
```

> [!IMPORTANT]
> If a `MEMBER` has no mailbox addresses assigned, their inbox will be completely empty. Always assign at least one mailbox address when creating a member account.

---

## Account Management

Admins and Owners can perform the following actions on user accounts from the **Users** panel:

| Action | Who Can Do It | Notes |
|--------|--------------|-------|
| Create user | `OWNER`, `ADMIN` | Sends an invitation email automatically |
| Edit user (name, email, role) | `OWNER`, `ADMIN` | Cannot promote anyone to `OWNER` |
| Assign mailbox access | `OWNER`, `ADMIN` | Replaces all existing access assignments atomically |
| Deactivate user (`isActive: false`) | `OWNER`, `ADMIN` | User cannot log in but account is preserved |
| Ban user (`isBanned: true`) | `OWNER`, `ADMIN` | Immediately blocks login; shown on next auth attempt |
| Delete user | `OWNER`, `ADMIN` | Permanently removes user. `OWNER` account cannot be deleted |

---

## Security Policies

All security constants are centrally defined in [`src/lib/auth.ts`](../src/lib/auth.ts) and applied consistently across the application.

| Policy | Value | Details |
|--------|-------|---------|
| Session duration | **30 days** | Cookie-based session; stored in `auth_session` cookie |
| Password hashing | **bcrypt, 12 rounds** | Optimal balance between security and performance |
| Invite token expiry | **48 hours** | Token is a secure 32-byte random hex string |
| Password reset link expiry | **1 hour** | Short window to reduce risk of link interception |
| Max failed login attempts | **5** | Account is locked after 5 consecutive failed logins |
| Lockout duration | **15 minutes** | Automatic unlock after the lockout window passes |

### Password Reset Flow

Users can reset their password via the **"Forgot Password"** link on the login page:

```
User enters email on /forgot-password
        │
        ▼
AuthService.requestPasswordReset()
        │  Generates a secure token (expires in 1 hour)
        │  Queues HIGH priority password reset email
        ▼
User receives email → clicks /reset-password?token=<token>
        │
        ▼
User enters new password → token is consumed and deleted
        │
        ▼
Password updated ✅ (old token can never be reused)
```

> [!NOTE]
> If the email address provided on the forgot-password page does not exist in the system, the API returns a success response anyway. This is a deliberate security practice to prevent **account enumeration attacks** — an attacker cannot determine which emails are registered.
