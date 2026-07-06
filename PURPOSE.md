# 🎯 Mailbox — Product Purpose

Mailbox is an **open-source email management platform** built for indie hackers, solo founders, small SaaS teams, and bootstrapped businesses. It provides professional email workflows without the overhead and recurring costs of expensive enterprise solutions like Google Workspace or Microsoft 365.

The core philosophy is simple: most small teams do not need a bloated enterprise suite. They need a fast, reliable way to receive emails on their custom domain, manage customer conversations, and collaborate — while keeping infrastructure costs close to zero.

---

## 💡 Why Mailbox Exists

Traditional business email providers charge recurring per-user fees. While reasonable for large enterprises, these costs quickly add up for small teams, side projects, and early-stage startups.

Mailbox solves this by leveraging **Cloudflare Email Routing**. Instead of purchasing dedicated mailboxes for every team member, incoming emails are routed through Cloudflare for free and processed securely by Mailbox.

Maintain professional addresses effortlessly:
- `support@yourdomain.com`
- `hello@yourdomain.com`
- `sales@yourdomain.com`

…all without per-seat subscriptions.

---

## ⚙️ How It Works

1. **Custom Domain Setup**: Connect your domain to Cloudflare and configure MX records.
2. **Email Routing**: Cloudflare receives incoming emails and forwards them to Mailbox via a secure webhook endpoint.
3. **Message Processing**: Mailbox validates, processes, and securely stores the email (metadata, attachments, conversation history).
4. **Unified Inbox**: All messages land in a centralized UI where permitted teams can read, search, and organize emails.
5. **Access Permissions**: Stop forwarding emails. Control exactly who can view which mailbox in your organization with granular access controls.
6. **Basic Organization**: Star important emails, move threads to the trash, and see read/unread counts per mailbox.

---

## ✨ Core Features

| Feature | Description |
| :--- | :--- |
| **Custom Domain Email** | Receive emails securely at `*@yourdomain.com`. |
| **Cloudflare Integration** | Zero-cost incoming email via Cloudflare Email Routing. |
| **Shared Team Inbox** | One unified inbox for multiple teammates. |
| **Access Control** | Restrict mailbox access on a per-user basis with Owner/Admin/Member hierarchy. |
| **Conversation Threads** | Full, organized reply chain history. |
| **Contact Management** | Track senders and historical communications automatically. |
| **Labels & Search** | Organize with custom labels and find messages instantly. |
| **Attachment Support** | Store, preview, and download file attachments. |
| **Modern UX** | Full light/dark mode support and installable PWA. |
| **Self-Hosted** | Deploy anywhere with full data ownership (Docker ready). |

---

## 🏗 Architecture & Philosophy

Built on a modern stack (**Next.js 16** & **Prisma 7**), Mailbox is designed to be highly flexible and easy to host:

- **Zero-Cost Ingress**: Cloudflare handles MX/SMTP routing for free.
- **Multi-Database Support**: Swap between SQLite (local dev), PostgreSQL, or MySQL via a single `.env` variable.
- **Self-Hosted First**: Deploy to any VPS or Docker host. No vendor lock-in.
- **Open-Source**: Transparent, customizable, and community-driven.

---

## 🎯 Target Audience

- **Indie Hackers & Solo Founders**
- **SaaS Teams & Startups** (< 20 people)
- **Agencies & Freelancers**
- **Open-Source & Community Projects**

**The Ideal User:** Already owns a custom domain, uses Cloudflare for DNS, wants professional email without recurring per-seat costs, and values self-hosted, open-source software.

---

## 🚀 Our Vision

To become the easiest, most cost-effective way for small businesses to manage domain-based communication.

> *"Professional email for your team. At infrastructure cost."*
