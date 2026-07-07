# 🚀 Getting Started

This guide walks you through setting up the Mailbox application locally from scratch.

---

## Prerequisites

Before you begin, ensure you have the following installed:

| Tool | Minimum Version | Notes |
|------|----------------|-------|
| Node.js | v20.x | Required |
| npm | v10.x | Required |
| Docker & Docker Compose | Latest | Optional — needed for local PostgreSQL/MySQL |

---

## Step 1 — Clone & Install

```bash
git clone https://github.com/Prashant4900/mail-box.git
cd mail-box
npm install
```

---

## Step 2 — Configure Environment Variables

Copy the example environment file:

```bash
cp .env.example .env
```

Open `.env` in your editor. The file is divided into annotated blocks. By default it is pre-configured for **SQLite** so you can start immediately with zero extra setup.

Key variables you should review:

| Variable | Description |
|----------|-------------|
| `DATABASE_URL` | Your active database connection string |
| `AUTH_SECRET` | A random secret string for session signing |
| `SMTP_HOST` | SMTP server hostname for outgoing email |
| `SMTP_PORT` | SMTP port (usually 465 or 587) |
| `SMTP_USER` | SMTP username / email address |
| `SMTP_PASS` | SMTP password |

---

## Step 3 — Initialize the Database

Generate the Prisma client types and synchronize the database schema:

```bash
npm run db:generate
npm run db:push
```

To load mock seed data for development:

```bash
npm run db:seed
```

To open Prisma Studio (visual database browser):

```bash
npm run db:studio
```

---

## Step 4 — Start the Development Server

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000).  
On first visit, the setup wizard will guide you through creating your admin account.

---

## First Login

1. Navigate to `http://localhost:3000/setup`.
2. Create your **Owner** account (name, email, password).
3. Log in and explore the dashboard.
4. Invite team members from the **Users** panel.

---

## Next Steps

- [Configure your database](Database-Setup) for production.
- [Set up Cloudflare](Cloudflare-Setup) for inbound email routing.
- [Deploy to production](Deployment).
