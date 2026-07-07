# 📬 Mailbox — Documentation Home

Welcome to the official documentation for **Mailbox**, a modern, production-ready, self-hosted email client and management platform built on Next.js 16 and Prisma 7.

---

## What is Mailbox?

Mailbox sits between your DNS provider (Cloudflare) and your team. It handles incoming email streams by automatically configuring mailboxes, routing rules, and Cloudflare Worker webhook processors on your domain — allowing your team to view and interact with incoming mail inside a beautiful, real-time dashboard.

---

## Quick Navigation

| Page | Description |
|------|-------------|
| [Getting Started](Getting-Started) | Install, configure, and run the app locally |
| [Architecture](Architecture) | 4-layer code architecture and system design |
| [Database Setup](Database-Setup) | SQLite, PostgreSQL, MySQL, and serverless options |
| [Cloudflare Setup](Cloudflare-Setup) | Connect your domain for inbound email routing |
| [Deployment](Deployment) | Deploy to Vercel or self-host with Docker |

---

## Inbound Email Flow

```
External Sender → Cloudflare Email Routing → Cloudflare Worker
    → Mailbox Webhook (/api/emails/incoming)
    → Prisma → Database
    → React Query → Dashboard UI
```

---

## Tech Stack at a Glance

| Layer | Technology |
|-------|-----------|
| Framework | Next.js 16 (App Router, React 19) |
| ORM | Prisma 7 |
| Database | SQLite / PostgreSQL / MySQL / Neon / Supabase |
| UI | Tailwind CSS v4, Hugeicons React |
| State / Cache | Tanstack React Query v5 |
| Auth | Custom cookie-based sessions, bcryptjs |
| i18n | next-intl (English & Spanish) |
| Email Routing | Cloudflare Email Routing + Workers |

---

## License

This project is licensed under the **Business Source License 1.1 (BUSL-1.1)**.  
Free for personal and non-commercial use. Commercial use requires a paid license.  
Contact **prashantnigam490@gmail.com** for commercial inquiries.

