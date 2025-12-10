# GenSpa — Spa & Wellness Booking, Services, Membership and E-Commerce Platform

GenSpa is a premium spa and wellness platform for India (default currency INR, timezone Asia/Kolkata, locale en-IN).
This repository is built as a single Next.js 16 (App Router) application with a layered, modular backend
and a PostgreSQL database accessed through Drizzle ORM.

> Status: **Phase 1 (Foundation) complete.** See `DEVELOPMENT_PROGRESS.md` for the module-by-module status.

## Stack

| Layer | Technology |
| --- | --- |
| UI | React 19, Tailwind CSS v4, Lucide icons, class-variance-authority design primitives |
| Routing | Next.js 16 App Router (pages + route handlers) |
| Forms & validation | React Hook Form, Zod 4 (shared client/server schemas) |
| Data fetching | TanStack Query (client mutations/queries), typed fetch wrapper |
| Database | PostgreSQL 15+, Drizzle ORM, `pg` driver, drizzle-kit migrations |
| Notifications | Sonner toasts |
| Testing | Vitest (unit + API integration against PostgreSQL) |

## Architecture

```
src/
  app/                      Routes: public pages, error/404 pages and /api/* route handlers (thin controllers)
    (public)/               Public website layout and home page
    api/health              Liveness and database readiness
    api/v1/…                Versioned REST API: services, site, newsletter
  components/
    ui/                     Design-system primitives (Button, Card, Input, FormField, feedback states)
    layout/                 Announcement bar, navbar, footer
    home/                   Homepage sections
    providers/              Client providers (TanStack Query, toasts)
  db/
    schema.ts               Complete Drizzle schema (56 tables)
    seed.ts                 Idempotent demo seed
    index.ts                Pooled database client
  hooks/                    Client hooks (mutations)
  lib/                      Shared client/server utilities (cn, date and duration formatting)
  server/                   Server-only code (guarded by the `server-only` package)
    env.ts                  Zod-validated environment
    http.ts                 Response envelopes, AppError, error mapping, JSON parsing
    rate-limit.ts           Fixed-window limiter
    *.service.ts            Business/service layer used by routes and server components
  services/                 Browser API clients
  shared/                   Contracts shared by browser and server: API envelopes, money, site content, validators
  test/                     Test-only shims
drizzle/                    Generated SQL migrations (0000 bootstrap extensions, 0001 initial schema)
public/images/              Local stock imagery used by the demo content
```

Design decisions:

- **One Next.js app instead of separate Vite + Express apps.** The workspace is provisioned as a Next.js + Drizzle
  project with a managed preview and health check, so the backend lives in route handlers. Business logic stays in
  `src/server/*.service.ts`, never in components or route files, so the layers can be split later without rewrites.
- **Drizzle instead of Prisma.** The workspace is pre-wired for Drizzle. Drizzle keeps SQL explicit, which matters for
  the booking exclusion constraints and money columns planned for later phases.
- **Money** is `NUMERIC(12,2)` in PostgreSQL, strings in transport and integer paise in code (`src/shared/money.ts`).
- **Response envelopes** follow the spec: `{ success, message, data }` or `{ success, message, errors[] }`.

## Getting started

Prerequisites: Node.js 22+, npm 10+, PostgreSQL 15+ (local instance).

```bash
cp .env.example .env            # then adjust DATABASE_URL if needed
npm install
npx drizzle-kit migrate         # applies migrations in ./drizzle (btree_gist + full schema)
npx tsx src/db/seed.ts          # idempotent demo content (branches, services, settings, menus, RBAC)
npm run dev                     # http://localhost:3000
```

### Useful commands

| Purpose | Command |
| --- | --- |
| Development server | `npm run dev` |
| Production build | `npm run build` then `npm run start` |
| Type check | `npm exec tsc -- --noEmit` |
| Lint | `npm run lint` |
| Tests (unit + integration) | `npx vitest run` |
| Generate migration after schema edits | `npx drizzle-kit generate --name=<description>` |
| Apply migrations | `npx drizzle-kit migrate` |
| Seed demo data | `npx tsx src/db/seed.ts` |

> The root `package.json` scripts are managed by the platform. Commands for migrations, seeding and tests are run
> directly with `npx` as shown above.

## API overview (Phase 1)

All responses use the envelope `{ "success": boolean, "message": string, "data"?: T, "errors"?: [{ "field", "message" }] }`.

| Method | Path | Description | Auth |
| --- | --- | --- | --- |
| GET | `/api/health` | Liveness and database readiness (503 when the database is unreachable) | Public |
| GET | `/api/v1/site` | Branding, homepage content, contact details, navigation | Public |
| GET | `/api/v1/services?featured=true&page=1&pageSize=12` | Active services with pagination | Public |
| POST | `/api/v1/newsletter` | Body `{ "email" }`. Idempotent. Rate limited to 5 requests per 10 minutes per client | Public |

Error codes: `400` malformed JSON, `422` validation failure (with `errors`), `429` rate limited (`Retry-After` header),
`409` unique conflict, `500` generic failure (the response includes a `requestId` for log correlation).

## Environment variables

See `.env.example`. Required: `DATABASE_URL` (PostgreSQL connection string). Everything else has safe defaults.
Secrets must never be prefixed with `NEXT_PUBLIC_`. Payment and email credentials are added in later phases and are
read only on the server.

## Database

- Schema source of truth: `src/db/schema.ts`. Generated SQL lives in `drizzle/` and must be committed.
- `drizzle/0000_bootstrap_extensions.sql` enables `btree_gist`, required for the staff double-booking exclusion
  constraints in the booking engine (Phase 5).
- Backups (production): use `pg_dump --format=custom --file=genspa-$(date +%F).dump "$DATABASE_URL"` on a schedule,
  test restores with `pg_restore --clean --if-exists`, and keep at least 30 days of retention off-host.

## Demo accounts

Demo user accounts are introduced in Phase 2 together with password hashing. This README will list the local-only
demo logins at that point. They must never be used in production.

## Security notes

- Secrets are read only in server code. `.env` is git-ignored.
- Security headers (`X-Frame-Options`, `X-Content-Type-Options`, `Referrer-Policy`, `Permissions-Policy`, HSTS in
  production) are set in `next.config.ts`.
- Public write endpoints are validated with Zod and rate limited. Forwarded IP headers are trusted only when
  `TRUST_PROXY=true`.
- Internal errors are logged server-side with a request ID and never returned to clients.

## Roadmap

Phases 2 to 13 are tracked in `DEVELOPMENT_PROGRESS.md`: authentication and RBAC, public website pages, services and
staff, booking engine, customer portal, memberships, e-commerce, payments, admin panel, CMS, notifications, and QA.
