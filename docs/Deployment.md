# 🚢 Deployment

Mailbox supports two primary deployment strategies. Choose the one that best fits your infrastructure.

---

## Option A — Vercel (Recommended)

Vercel is the easiest and fastest way to deploy a Next.js application. It handles scaling, SSL, and zero-downtime deployments automatically.

### Step 1 — Connect Repository

1. Go to [vercel.com](https://vercel.com) and log in.
2. Click **Add New Project** → Import your `mail-box` GitHub repository.
3. Select **Next.js** as the framework preset (should be auto-detected).

### Step 2 — Configure Environment Variables

In the Vercel project settings, add the following environment variables:

| Variable | Description |
|----------|-------------|
| `DATABASE_URL` | Pooled connection string from Neon/Supabase |
| `AUTH_SECRET` | A long random secret string (use `openssl rand -base64 32`) |
| `SMTP_HOST` | Outgoing SMTP server |
| `SMTP_PORT` | SMTP port (465 or 587) |
| `SMTP_USER` | SMTP username |
| `SMTP_PASS` | SMTP password |
| `NEXT_PUBLIC_APP_URL` | Your public app URL (e.g., `https://mail.yourcompany.com`) |

### Step 3 — Set Build Command

In **Project Settings** → **Build & Development Settings**, set the Build Command to:

```bash
npm run vercel-build
```

This command runs:
```bash
prisma generate && prisma db push && next build
```
It automatically handles client generation, schema sync, and the Next.js production build.

### Step 4 — Deploy

Click **Deploy**. Vercel will build and publish the application. Your app will be live at a `.vercel.app` URL, which you can then map to your custom domain.

---

## Option B — Self-Hosted (VPS with Docker)

Use this option if you want full control over your infrastructure (AWS EC2, DigitalOcean Droplet, Hetzner, etc.).

### Prerequisites

- A Linux VPS with Docker and Docker Compose installed.
- A domain name pointing to your server's IP address.
- A reverse proxy (Nginx or Caddy) for SSL termination.

### Step 1 — Clone the Repository on the Server

```bash
git clone https://github.com/Prashant4900/mail-box.git
cd mail-box
```

### Step 2 — Configure Environment

```bash
cp .env.example .env
nano .env  # or use your preferred editor
```

Fill in your production database URL, SMTP credentials, and app URL.

### Step 3 — Start the Application

```bash
npm run docker:up
```

This builds the Docker image and starts all containers in detached mode.

### Step 4 — Configure Nginx as a Reverse Proxy

```nginx
server {
    listen 80;
    server_name mail.yourcompany.com;

    location / {
        proxy_pass http://localhost:3000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_cache_bypass $http_upgrade;
    }
}
```

Use [Certbot](https://certbot.eff.org/) to provision a free SSL certificate:

```bash
sudo certbot --nginx -d mail.yourcompany.com
```

---

## Docker Commands Reference

| Command | Description |
|---------|-------------|
| `npm run docker:up` | Build and start all containers |
| `npm run docker:down` | Stop and remove containers |
| `npm run docker:logs` | Stream live logs from all containers |

---

## Post-Deployment Checklist

- [ ] Application loads at your public URL over HTTPS.
- [ ] Setup wizard completes and admin account is created.
- [ ] Database connection is healthy (check logs).
- [ ] SMTP sending works (send a test email from compose).
- [ ] Cloudflare domain is linked in Settings.
- [ ] At least one mailbox address is configured and tested.
- [ ] Team members are invited via the Users panel.

---

## Updating the Application

### Vercel
Pushing to the `main` branch on GitHub will trigger an automatic Vercel deployment. Zero manual steps needed.

### Self-Hosted (Docker)
```bash
cd mail-box
git pull origin main
npm run docker:down
npm run docker:up
```
