# 🏗 Architecture

Mailbox is built around a strict **4-Layer Architecture** to ensure separation of concerns, testability, and long-term maintainability.

---

## The Golden Rule

> **Data flows strictly upward. Never skip a layer.**

```
Repositories  ──►  Services  ──►  Queries (React Query)  ──►  UI Components
   (DB)           (Logic)             (Bridge)                  (View)
```

---

## Layer 1 — Repositories (`src/repositories/`)

**Responsibility:** Raw database communication only.

- All Prisma queries, inserts, updates, and deletes live here.
- **Strict rule:** No business logic, no validation, no formatting.
- Named after the entity they manage: `user.repository.ts`, `email.repository.ts`, etc.

```ts
// ✅ Correct — pure data access
export async function findUserByEmail(email: string) {
  return prisma.user.findUnique({ where: { email } });
}
```

---

## Layer 2 — Services (`src/services/`)

**Responsibility:** Business logic and validation.

- The backend "brain" of the application.
- Calls Repositories to fetch data, then transforms, validates, and enforces authorization rules.
- Never called directly from the UI layer.

```ts
// ✅ Correct — business logic
export async function loginUser(email: string, password: string) {
  const user = await findUserByEmail(email);
  if (!user) throw new Error("User not found");
  const valid = await bcrypt.compare(password, user.passwordHash);
  if (!valid) throw new Error("Invalid credentials");
  return createSession(user);
}
```

---

## Layer 3 — Queries (`src/queries/`)

**Responsibility:** Bridge between UI and the backend API.

- Custom React Query hooks using `@tanstack/react-query`.
- Call Next.js API routes via `fetch`, which in turn call Services.
- Handle caching, invalidation, optimistic updates, and loading/error states.

```ts
// ✅ Correct — query bridge
export function useEmails() {
  return useQuery({ queryKey: ["emails"], queryFn: () => fetch("/api/emails").then(r => r.json()) });
}
```

---

## Layer 4 — UI (`src/components/` & `src/app/`)

**Responsibility:** Rendering only.

- React components and Next.js App Router pages.
- Consume Query hooks for data and dispatch mutations.
- **Strictly forbidden:** Direct Prisma calls, heavy business logic, raw fetch calls outside of query hooks.

---

## Centralization Rules

### Types → `src/types/index.ts`
All shared TypeScript interfaces, enums, and Zod schemas must be defined and exported from a single file.

### Icons → `src/components/icons/index.ts`
Every icon from `hugeicons-react` or any SVG must be registered here first. UI components must import from this registry, not directly from the package.

### Auth → `src/lib/auth.ts`
All session handling, cookie rules, cryptographic operations, and auth constants live here exclusively.

---

## Project Directory Structure

```
src/
├── app/                  # Next.js App Router pages & API routes
│   ├── (auth)/           # Login, setup, invite, password reset
│   ├── (dashboard)/      # Main app: inbox, sent, starred, compose...
│   └── api/              # REST API endpoints
├── components/
│   ├── icons/            # Central icon registry
│   ├── mailbox/          # Mailbox-specific components
│   └── ui/               # Generic reusable UI primitives
├── queries/              # Tanstack React Query hooks
├── repositories/         # Prisma data access layer
├── services/             # Business logic layer
├── lib/                  # Utilities: auth.ts, utils.ts, constants.ts
├── types/                # All shared TypeScript types & Zod schemas
├── providers/            # React context providers (QueryProvider, ThemeProvider)
├── messages/             # i18n translation files (en.json, es.json)
└── store/                # Zustand client-side state store
```

---

## System-Level Flow: Inbound Email

```
Cloudflare Worker
       │  HTTP POST (MIME payload)
       ▼
/api/emails/incoming (Next.js Route Handler)
       │  calls
       ▼
email.service.ts (parse, validate, authorize)
       │  calls
       ▼
email.repository.ts (prisma.email.create / thread upsert)
       │  writes to
       ▼
Database (SQLite / PostgreSQL)
       │  React Query refetch
       ▼
Dashboard UI (real-time update)
```
