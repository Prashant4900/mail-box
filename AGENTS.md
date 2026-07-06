@README.md

<!-- BEGIN:nextjs-agent-rules -->

# This is NOT the Next.js you know

This version has breaking changes — APIs, conventions, and file structure may all differ from your training data. Read the relevant guide in `node_modules/next/dist/docs/` before writing any code. Heed deprecation notices.

<!-- END:nextjs-agent-rules -->

# Project Workflow & Architecture

When working on this project, please refer to the [README.md](./README.md) file. It contains the essential workflow, deployment commands, and our multi-database `.env` switching architecture. Do not modify the database or Docker configuration without referencing the README first.

## Strict 4-Layer Architecture

All new features MUST adhere to our strict 4-layer architecture. Data strictly flows upwards: `Repositories -> Services -> Queries -> UI`. Do NOT skip layers.

1. **`src/repositories/`**: Handles raw database communication (Prisma calls). MUST NOT contain business logic.
2. **`src/services/`**: The brain. Executes pure business logic, validation, and data formatting.
3. **`src/queries/`**: Custom React Query hooks (Tanstack) that bridge the UI to the Services.
4. **`src/components/` & `src/app/`**: Your UI layer. MUST NOT contain direct DB calls or heavy business logic.

## Centralized Resources

- **Types**: All shared interfaces, enums, and Zod schemas MUST be defined in `src/types/` and exported via `src/types/index.ts`.
- **Icons**: Every SVG or icon (e.g., from `hugeicons-react`) MUST be registered in `src/components/icons/index.ts`. Do not import icons directly into UI components; import them from the registry.
- **Design & Colors**: Always use a `.css` file for styling. Do not define any hardcoded styles in the application. If you need any design color, first define it in a `.css` file, then use it.
- **Authentication**: All auth-related constants, logic configurations, session rules, and token settings MUST be strictly defined and exported from `src/lib/auth.ts`.

## Code Quality & Warnings

- **No Suppressions**: Do not suppress any linter, formatter, or compiler warnings (e.g., using `// biome-ignore`, `// eslint-disable`, `// @ts-ignore`, `// @ts-nocheck`, etc.). All issues must be resolved at the root level by correcting the underlying code or types.
