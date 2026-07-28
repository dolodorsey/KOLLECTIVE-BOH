# KOLLECTIVE-BOH → Vercel Migration

Branch: `migrate/vercel-native` · 2026-07-28

Ports the Rork-generated Expo app onto Vercel and cuts every dependency on a
dead or banned platform. The app stays Expo + expo-router; only the hosting,
API, and data wiring change.

## What changed

| # | Step | Result |
|---|------|--------|
| 1 | Duplicate folders | Deleted `BOH-PART1 2/` and `BOH-PART2 2/` — 115 files, 32% of the repo. One canonical copy of `supabase-schema.sql`, `rls-policies.sql`, `seed-data.sql` remains. |
| 2 | Vercel config | `vercel.json` (build `npx expo export -p web`, output `dist`, SPA rewrites) + `api/index.ts` mounting the existing Hono app via `hono/vercel`. |
| 3 | Dead Replit API | `kollective-api--drdor5.replit.app` (404) removed. `lib/api.ts` and `lib/trpc.ts` now resolve to the app's own origin on web, `EXPO_PUBLIC_API_URL` on native. The Hono/tRPC backend ships in the same project. |
| 4 | n8n | Dead `n8nClient.ts` deleted (imported by nothing). `n8n_endpoint` → `endpoint_url` across types + tRPC routes. `N8N-WORKFLOWS-SETUP.sql` → `AUTOMATION-JOBS-SETUP.sql`, with all 20 endpoints repointed from `drdorsey.app.n8n.cloud` (404) to Supabase Edge Functions. `MIGRATION-001-drop-n8n.sql` renames the DB column and deactivates stale rows. |
| 5 | Supabase | Hardcoded fallback to `wfkohcwxxsrhcxhepfql` removed. `env.example` defaults to the KHG gateway (`dzlmtvodpyhetvektfuo`) — same backend as thedoctordorsey.com. |
| 6 | Rork | `withRorkMetro` removed from `metro.config.js`; `@rork-ai/toolkit-sdk` dropped; `rork start` scripts replaced with plain `expo`; bundle ID `app.rork.kollective-os-dashboard` → `com.kollective.boh`; Rork env vars deleted. |

## Deploy

1. Run `MIGRATION-001-drop-n8n.sql` against the BOH Supabase project **first**.
2. Vercel project `kollective-boh`, **root directory `expo`**.
3. Env: `EXPO_PUBLIC_SUPABASE_URL`, `EXPO_PUBLIC_SUPABASE_ANON_KEY`, `EXPO_PUBLIC_API_URL`, `EXPO_PUBLIC_AUTOMATION_URL`.
4. Deploy to the Vercel URL and verify before attaching `thekollectivegroup.com` — that domain currently serves other content.

## Not done — needs a decision

- **Data plane.** `env.example` now defaults to the gateway, but no data was migrated. If `supabase_kollective_boh` holds production rows they must be moved deliberately. Nothing was deleted from either project.
- **20 Edge Functions don't exist yet.** `AUTOMATION-JOBS-SETUP.sql` registers the correct URLs; the functions still have to be written. Until then those endpoints 404 — same as the n8n ones they replace, but now pointing somewhere buildable.
- **`rork.json`** left at repo root (harmless, outside the build path).
