# GenSpa — Development Progress

Last updated: Phase 1 (Foundation) implementation pass.

## Phase status

| Phase | Scope | Status |
| --- | --- | --- |
| 1 | Foundation: project setup, architecture, DB, shared contracts, env, layouts, design system | **Complete. All validation gates passed (see Tests performed)** |
| 2 | Authentication and RBAC | Not started |
| 3 | Public website (pages, SEO) | Not started (homepage foundation delivered in Phase 1) |
| 4 | Services and staff management | Not started (schema delivered in Phase 1) |
| 5 | Booking engine | Not started (`btree_gist` enabled, `slot_holds` table in place) |
| 6 | Customer portal | Not started |
| 7 | Membership | Not started (schema delivered in Phase 1) |
| 8 | E-commerce | Not started (schema delivered in Phase 1) |
| 9 | Payments (Razorpay test mode) | Not started (`payments`, `refunds`, `webhook_events` tables delivered) |
| 10 | Admin panel | Not started |
| 11 | CMS | Not started (tables delivered) |
| 12 | Notifications and advanced features | Not started (`notifications`, `loyalty_transactions` tables delivered) |
| 13 | QA, security audit, accessibility, deployment docs | Not started |

## Architecture decisions (Phase 1)

- **Stack deviation, deliberate.** The workspace is provisioned as Next.js 16 + Drizzle + PostgreSQL with a managed
  preview and health check. The requested Vite + Express + Prisma split was replaced with a single Next.js app that
  keeps the same layering: route handlers (controllers), `src/server/*.service.ts` (services), `src/shared/*`
  (contracts and validators), and `src/db` (data access). Trade-off: no separate API deployable. Benefit: one build,
  one type system, and a working preview.
- **Drizzle instead of Prisma.** Same relational model, explicit SQL, and native support for the PostgreSQL features
  we need (exclusion constraints, partial indexes, `NUMERIC`).
- **Money.** `NUMERIC(12,2)` in the database, strings over the wire, integer paise in code.
- **Public content from settings.** Homepage copy, navigation and contact details are read from `settings` and `menus`
  with typed defaults, so the admin CMS (Phase 10/11) can edit them without code changes.
- **Server Components and REST share one service layer.** Pages call the service layer directly for SSR; browser
  code calls `/api/v1/*` through `src/services/api-client.ts`.

## Completed in Phase 1

- Next.js 16 App Router, React 19, Tailwind CSS v4 design tokens (brand palette, Playfair Display / Inter typography).
- Design-system primitives: `Button` (variants, loading state), `Card`, `Badge`, `Input`, `FormField`, `Skeleton`,
  `EmptyState`, `ErrorState`, `Container`, `SectionHeading`.
- Public layout: announcement bar, sticky responsive navbar with mobile menu, skip link, footer with DB-driven
  navigation and contact details.
- Homepage: hero, about, featured services (from the database), why choose us, how it works, newsletter CTA.
- Newsletter flow end to end: React Hook Form + Zod on the client, Zod on the server, rate limiting, idempotent
  database write, TanStack Query mutation, and toast feedback.
- Shared API envelope (`success`, `message`, `data`, `errors`), `AppError`, error mapping (422, 409, 400, 429, 500),
  request IDs for 500 responses.
- Zod-validated environment with safe defaults and server-only guard.
- Complete Drizzle schema for all 56 domain tables, generated migrations, `btree_gist` bootstrap migration.
- Idempotent seed: 20 permissions, 5 system roles with role-permission mapping, 7 public settings groups,
  3 branches (Mumbai, Bengaluru, New Delhi), 4 service categories, 12 services (6 featured) with local imagery,
  branch-service links, 2 navigation menus.
- Security headers (no-sniff, frame deny, referrer policy, permissions policy, HSTS in production).
- Error boundary page and branded 404 page.

## Database changes

- `drizzle/0000_bootstrap_extensions.sql`: `CREATE EXTENSION IF NOT EXISTS btree_gist`.
- `drizzle/0001_initial_schema.sql`: 56 tables, 21 enums, foreign keys, unique constraints, check constraints and indexes.
  Groups: identity and RBAC; branches and staff scheduling; service catalogue; bookings and slot holds; memberships;
  e-commerce (products, carts, orders, coupons); payments, refunds and webhook ledger; CMS; engagement; settings and
  audit logs.
- Notes for later phases: the staff double-booking `EXCLUDE` constraint (booking engine) is added as a custom migration.
  `bookings.coupon_id` is a plain column to avoid a circular module dependency. It is validated in the service layer.

## API endpoints

| Method | Path | Status |
| --- | --- | --- |
| GET | `/api/health` | Implemented (200 healthy, 503 when the database is unreachable) |
| GET | `/api/v1/site` | Implemented |
| GET | `/api/v1/services` | Implemented (featured filter and pagination) |
| POST | `/api/v1/newsletter` | Implemented (201 subscribed, 200 already subscribed or resubscribed, 422, 429) |

## Files created or replaced (Phase 1)

- Configuration: `next.config.ts`, `.env.example`, `.gitignore`, `vitest.config.mts`, `drizzle.config.json` (unchanged).
- Database: `src/db/schema.ts`, `src/db/seed.ts`, `drizzle/*`.
- Shared contracts: `src/shared/api.ts`, `src/shared/money.ts`, `src/shared/site.ts`, `src/shared/validators.ts`.
- Server: `src/server/env.ts`, `src/server/logger.ts`, `src/server/http.ts`, `src/server/rate-limit.ts`,
  `src/server/site.service.ts`, `src/server/catalog.service.ts`, `src/server/newsletter.service.ts`.
- Routes: `src/app/api/health/route.ts`, `src/app/api/v1/{services,site,newsletter}/route.ts`.
- App shell: `src/app/layout.tsx`, `src/app/globals.css`, `src/app/(public)/{layout,page}.tsx`, `src/app/not-found.tsx`,
  `src/app/error.tsx`. The legacy starter `src/app/page.tsx` was removed.
- Components: `src/components/ui/*`, `src/components/layout/*`, `src/components/home/*`, `src/components/providers/*`.
- Client layer: `src/services/api-client.ts`, `src/hooks/use-newsletter-subscribe.ts`, `src/lib/utils.ts`.
- Tests: `src/shared/shared.test.ts`, `src/server/server.test.ts`, `src/server/integration.test.ts`, `src/test/server-only.ts`.
- Docs: `README.md`, `DEVELOPMENT_PROGRESS.md`.
- Images: `public/images/hero.jpg`, `public/images/about.jpg`, `public/images/services/service-01..10.jpg`.
  These are stock photographs from Pexels, used as placeholders until the admin media library exists.

## Tests performed

Recorded after the Phase 1 validation run:

- Type generation (`npx next typegen`): passed.
- TypeScript (`npm exec tsc -- --noEmit`): passed with zero errors.
- Production build (`npm run build`): passed. Routes: `/` (dynamic), `/_not-found` (static), `/api/health`,
  `/api/v1/services`, `/api/v1/site`, `/api/v1/newsletter` (dynamic).
- ESLint (`npx eslint .`): zero errors. One warning: Google Fonts is loaded through a stylesheet link (see Known limitations).
- Platform bootstrap and health check (`build_and_start`): passed.
- Live smoke checks on the preview: `/api/health` returns 200 with `database: connected`; `/api/v1/site` returns 200
  with DB-backed navigation; `/api/v1/services?featured=true` returns seeded services with pagination; invalid
  newsletter input returns 422 with a field error; `/` renders the seeded services; unknown paths return 404.
- Database: `drizzle-kit migrate` applied both migrations (56 tables, `btree_gist` enabled). The seed ran once and
  inserted 20 permissions, 5 roles, 3 branches, 4 categories, 12 services, 36 branch-service links, 7 settings and
  9 menu items. Re-running it is safe by design (`ON CONFLICT DO NOTHING` or `DO UPDATE` for RBAC rows only), but
  a second run has not been executed yet.
- Unit tests (Vitest, 24 of 24 passing across 3 test files, run after the final code change): money arithmetic and rounding, validators (email, Indian mobile, password policy), class merging,
  duration formatting, environment validation, rate limiter windows, response envelopes and error mapping.
- Integration tests (Vitest, real PostgreSQL): `/api/health` connectivity, newsletter idempotency and validation,
  site configuration, service listing with pagination.

## Known limitations

- Rate limiting is per process (in-memory). Use a shared store (Redis) before running multiple instances.
- Google Fonts are loaded from the CDN through `<link>` tags. Self-hosting via `next/font` is planned for Phase 13.
- The stock images are placeholders. Replace them with branded photography in the CMS.
- No content security policy yet. It needs a nonce-based policy once third-party scripts (Razorpay) are added.
- Root `package.json` scripts for seed, migrate and test were not added. The project rule forbids editing that file
  directly, so these commands are documented as `npx` commands instead.
- The Phase 1 homepage links only to in-page anchors. Individual service, about and contact pages arrive in Phase 3.

## Remaining tasks (next phase, Phase 2)

1. Argon2id or bcrypt password hashing, plus signup, login, logout, and forgot and reset password.
2. Email verification tokens (`auth_tokens`) and refresh-token rotation (`refresh_tokens`) using HTTP-only cookies.
3. CSRF protection for cookie-authenticated mutations and login brute-force protection (per-account lockout).
4. Authorization middleware and role guards (`requireRole`, `requirePermission`, branch scoping for BRANCH_MANAGER).
5. Protected route groups for customer, staff and admin areas. Enforced in route handlers, not only in the UI.
6. Demo accounts in the seed (SUPER_ADMIN, ADMIN, two BRANCH_MANAGERs, STAFF, CUSTOMER) and their README section.
7. Audit log writes for sensitive administrative actions.
8. Tests: authentication, authorization matrix, signup validation, and login form and protected-route UI tests.
