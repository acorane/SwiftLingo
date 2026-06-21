# SwiftLingo

A Telegram Mini App marketplace for translation jobs connecting clients and freelance translators.

## Run & Operate

- `pnpm --filter @workspace/api-server run dev` — run the API server (port 8080)
- `pnpm --filter @workspace/swiftlingo run dev` — run the frontend (port from env)
- `pnpm run typecheck` — full typecheck across all packages
- `pnpm run build` — typecheck + build all packages
- `pnpm --filter @workspace/api-spec run codegen` — regenerate API hooks and Zod schemas from OpenAPI spec
- `pnpm --filter @workspace/db run push` — push DB schema changes (dev only)
- Required env: `DATABASE_URL` — Postgres connection string, `SESSION_SECRET` — JWT signing secret

## Stack

- pnpm workspaces, Node.js 24, TypeScript 5.9
- Frontend: React + Vite (artifacts/swiftlingo, path `/`)
- API: Express 5 (artifacts/api-server, path `/api`)
- DB: PostgreSQL + Drizzle ORM (`lib/db`)
- Auth: JWT (via SESSION_SECRET), Telegram WebApp initData validation
- API client: Orval-generated hooks (`lib/api-client-react`)
- i18n: Custom context in `artifacts/swiftlingo/src/lib/i18n.tsx` (EN/UZ/RU)
- UI: shadcn/ui + Tailwind CSS

## Where things live

- `lib/db/src/schema/` — all DB tables (users, jobs, bids, contracts, messages, payments, reviews, notifications, translator_profiles, translator_applications)
- `lib/api-spec/` — OpenAPI spec (source of truth for API contract)
- `lib/api-client-react/src/generated/api.ts` — generated hooks (do not edit manually)
- `artifacts/api-server/src/routes/` — Express route handlers
- `artifacts/api-server/src/middlewares/auth.ts` — JWT middleware
- `artifacts/swiftlingo/src/lib/auth.tsx` — AuthContext + Telegram auth + JWT storage
- `artifacts/swiftlingo/src/lib/i18n.tsx` — i18n translations
- `artifacts/swiftlingo/src/pages/` — all page components

## Architecture decisions

- Contract-first API: OpenAPI spec → Orval codegen → typed hooks. Never write API calls by hand.
- JWT token stored in localStorage as `swiftlingo_token`; injected via `setAuthTokenGetter`
- 10% platform fee hardcoded in `artifacts/api-server/src/routes/bids.ts` (handleAcceptBid)
- Chat (messages) is locked until payment status is `confirmed` — enforced server-side
- Dev mode: pass any string as initData to `/api/auth/telegram` to get a test user (telegramId: "dev_user_1")

## Product

- **Clients** post translation jobs (language pair, budget, delivery type, specialization)
- **Translators** apply to platform, get approved, then bid on jobs
- Accepted bid creates a contract; client pays into escrow (10% platform fee retained)
- Payment unlocks chat between client and translator
- Translator marks delivered; client approves → payment released, review unlocked
- Notifications for bids, contracts, messages, payments
- 3-language UI: English, Uzbek, Russian

## User preferences

_Populate as you build — explicit user instructions worth remembering across sessions._

## Gotchas

- Dev login: the login page in dev mode sends `initData = "mock_dev_init_data"` — server accepts any non-empty string in non-production
- `pnpm --filter @workspace/api-spec run codegen` must be re-run after any OpenAPI spec change
- `ListNotificationsParams.unreadOnly` is a boolean (not string) — use `true` not `"true"`
- `ListJobsParams.limit` and `.offset` are numbers not strings

## Pointers

- See the `pnpm-workspace` skill for workspace structure, TypeScript setup, and package details
