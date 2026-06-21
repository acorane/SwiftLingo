---
name: SwiftLingo Architecture
description: Key decisions, quirks, and constraints for the SwiftLingo Telegram Mini App marketplace
---

## Auth
- JWT stored in localStorage as `swiftlingo_token`
- Injected via `setAuthTokenGetter` from `lib/api-client-react/src/index.ts`
- Dev mode: any non-empty `initData` string accepted by `/api/auth/telegram`; creates user with telegramId `"dev_user_1"`
- Middleware: `artifacts/api-server/src/middlewares/auth.ts` — verifies JWT using `SESSION_SECRET`

## Platform fee
- 10% hardcoded in `handleAcceptBid` in `artifacts/api-server/src/routes/bids.ts`
- `translatorPayout = agreedPrice * 0.9`, `platformFee = agreedPrice * 0.1`

## Chat gate
- Messages are only sent/fetched when contract `paymentStatus === "confirmed"` or `"released"`
- Enforced server-side in messages route; frontend also gates the UI

## API codegen
- Source of truth: `lib/api-spec/` (OpenAPI YAML)
- Generated output: `lib/api-client-react/src/generated/api.ts`
- Re-run: `pnpm --filter @workspace/api-spec run codegen`
- Never edit generated file manually

## Type quirks
- `ListNotificationsParams.unreadOnly` is boolean, not string
- `ListJobsParams.limit` and `offset` are numbers, not strings
- `getGetMyTranslatorApplicationQueryKey` IS exported from the generated API — don't define a local duplicate

## i18n
- Stored in `artifacts/swiftlingo/src/lib/i18n.tsx`
- Language persisted in localStorage as `swiftlingo_lang`
- Three locales: en, uz, ru

**Why:** These are runtime-invisible decisions that caused bugs and are not derivable from code inspection alone.
**How to apply:** Check these constraints before writing new API calls, auth logic, or i18n code.
