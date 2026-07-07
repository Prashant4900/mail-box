# 🗄 Database Setup

Mailbox supports swapping database engines dynamically without changing any application code. The database provider is controlled entirely through your `.env` file.

---

## Supported Databases

| Database | Best For | Notes |
|----------|----------|-------|
| SQLite | Local development | Zero config, built-in, fastest to start |
| PostgreSQL (Docker) | Staging / local production testing | Requires Docker |
| MySQL (Docker) | Staging / local production testing | Requires Docker |
| Neon / Supabase (PostgreSQL) | Cloud / serverless production | Pooled connection required |

---

## Flow A — SQLite (Default — Local Development)

The fastest way to get started. No containers required.

**1. Ensure SQLite is active in `.env`:**
```env
# Uncomment the SQLite block
DATABASE_URL="file:./dev.db"
```

**2. Generate Prisma Client:**
```bash
npm run db:generate
```

**3. Sync schema:**
```bash
npm run db:push
```

**4. (Optional) Seed with mock data:**
```bash
npm run db:seed
```

---

## Flow B — Local PostgreSQL / MySQL (Docker)

Use this when you want to test against a production-grade relational database locally.

**1. Start containers:**
```bash
npm run docker:up
```

**2. Update `.env` — uncomment the PostgreSQL block:**
```env
DATABASE_URL="postgresql://mailbox:mailbox@localhost:5432/mailbox"
```

Or for MySQL:
```env
DATABASE_URL="mysql://mailbox:mailbox@localhost:3306/mailbox"
```

**3. Generate client and apply migrations:**
```bash
npm run db:generate
npm run db:migrate
```

**4. Stop containers when done:**
```bash
npm run docker:down
```

---

## Flow C — Serverless PostgreSQL (Neon / Supabase)

Use this for cloud deployments with connection pooling.

> [!IMPORTANT]
> Serverless providers use a transactional connection pooler. You must use `db:push` instead of `db:migrate` to apply schema changes, as standard migration commands can fail through the pooler proxy.

**1. Copy the pooled connection string from your Neon / Supabase dashboard.**

**2. Set it in `.env`:**
```env
DATABASE_URL="postgresql://user:password@host:5432/dbname?pgbouncer=true&connection_limit=1"
```

**3. Generate client:**
```bash
npm run db:generate
```

**4. Push schema (bypasses lock restrictions):**
```bash
npm run db:push
```

---

## Useful Database Commands

| Command | Description |
|---------|-------------|
| `npm run db:generate` | Generate Prisma client type definitions |
| `npm run db:push` | Push schema to database without migrations |
| `npm run db:migrate` | Run Prisma migration files |
| `npm run db:studio` | Open visual Prisma Studio browser |
| `npm run db:seed` | Seed the database with mock email data |
| `npm run db:test` | Run database connectivity test script |

---

## Schema Location

The Prisma schema files are located in:

```
prisma/
├── sqlite/
│   ├── schema.prisma          # SQLite schema
│   └── migrations/            # SQLite migration history
├── postgres/
│   ├── schema.prisma          # PostgreSQL schema
│   └── migrations/            # PostgreSQL migration history
└── mysql/
    ├── schema.prisma          # MySQL schema
    └── migrations/            # MySQL migration history
```

The active schema is controlled by your `prisma.config.ts` file, which reads from the `DATABASE_URL` environment variable.
