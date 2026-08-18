# KOLLECTIVE BOH Environment Setup — Current Direct Architecture

## Current rule

The BOH client talks directly to **KOLLECTIVE BOH Supabase** for authenticated data access. Sensitive or privileged actions belong in approved Supabase Edge Functions / database RPCs / server-side services.

The old Replit API client, n8n webhook client, webhook registry, and n8n environment variables are retired.

## Client environment

Create a local `.env` only in your development environment. Never commit it.

```bash
EXPO_PUBLIC_SUPABASE_URL=https://wfkohcwxxsrhcxhepfql.supabase.co
EXPO_PUBLIC_SUPABASE_ANON_KEY=<publishable client key>
```

Rork may inject build/runtime values when applicable:

```bash
EXPO_PUBLIC_RORK_DB_ENDPOINT=
EXPO_PUBLIC_RORK_DB_NAMESPACE=
EXPO_PUBLIC_RORK_DB_TOKEN=
EXPO_PUBLIC_RORK_API_BASE_URL=
EXPO_PUBLIC_TOOLKIT_URL=
EXPO_PUBLIC_PROJECT_ID=
EXPO_PUBLIC_TEAM_ID=
```

Do not put service-role keys, provider secrets, webhook signing keys, or private API credentials in any `EXPO_PUBLIC_*` variable.

## Retired variables — do not restore

```text
EXPO_PUBLIC_N8N_WEBHOOK_URL
EXPO_PUBLIC_WEBHOOK_URL
EXPO_PUBLIC_WEBHOOK_PATH
EXPO_PUBLIC_API_URL pointing to the old Replit API
```

## Data access pattern

Use `@/lib/supabase` for client data access and Supabase Auth.

Typical flow:

```text
Expo BOH client
  -> Supabase Auth session
  -> RLS-protected BOH tables/views
  -> approved RPC / Edge Function for privileged operations
```

Do not add a generic external workflow/webhook router between the client and BOH.

## Security

- `.env` stays local and ignored by Git.
- `EXPO_PUBLIC_*` is public client configuration only.
- RLS is the client authorization boundary.
- Service-role access is server-side/internal only.
- Use specific Edge Functions/RPCs for privileged mutations rather than exposing generic service-role proxies.
- Never embed Supabase service-role keys in Expo/mobile/web bundles.

## Verification

1. Start Expo with a valid client Supabase URL/key.
2. Sign in through Supabase Auth.
3. Confirm profile and org/entity memberships load through RLS.
4. Confirm privileged actions use their specific approved RPC/Edge Function.
5. Search the current code before introducing any new external API dependency.

Useful checks:

```bash
# current code should not require these legacy names
grep -R "n8n\|EXPO_PUBLIC_WEBHOOK_URL\|EXPO_PUBLIC_API_URL.*replit" . --exclude-dir=node_modules
```

## Architecture source of truth

The live Supabase project and current application code are authoritative. Historical completion reports, merge snapshots, or deprecated workflow documentation must not be used as deployment instructions.

---
**Status:** Direct-first BOH architecture
