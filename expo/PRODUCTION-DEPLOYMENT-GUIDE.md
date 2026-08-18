# KOLLECTIVE BOH Production Deployment — Current Architecture

## Source of truth

The BOH application uses KOLLECTIVE BOH Supabase directly for authenticated client data, with RLS protecting client-accessible tables/views. Privileged operations use specific approved Supabase RPCs and Edge Functions.

The following deployment architecture is retired:
- n8n webhook registry/router
- `webhook_registry` / `workflow_executions` tables
- generic n8n webhook endpoint configuration
- the legacy Replit `EXPO_PUBLIC_API_URL`
- generic external workflow execution as the BOH data plane

## Client configuration

Required public client configuration:

```bash
EXPO_PUBLIC_SUPABASE_URL=https://wfkohcwxxsrhcxhepfql.supabase.co
EXPO_PUBLIC_SUPABASE_ANON_KEY=<publishable client key>
```

Never place a service-role key in the Expo client.

## Production data flow

```text
Expo / web BOH client
  -> Supabase Auth
  -> RLS-protected BOH tables/views
  -> specific RPC / Edge Function for privileged operations
  -> direct provider APIs only through secure server-side functions when required
```

## Deployment checklist

1. Confirm the app builds against the current `expo/` root only.
2. Confirm no retired merge-snapshot directories are used.
3. Verify client Supabase URL/publishable key.
4. Verify authentication and BOH membership access.
5. Run security advisors before schema changes are considered complete.
6. Verify Edge Functions individually; do not create generic service-role proxy endpoints.
7. Confirm RLS on all client-reachable tables.
8. Confirm environment examples contain no n8n/Replit production dependency.
9. Search current source for retired names before release.

## Verification searches

```bash
grep -R "n8n\|drdorsey.app.n8n.cloud\|kollective-api.*replit\|webhook_registry\|workflow_executions" . \
  --exclude-dir=node_modules
```

Any hit in current executable code requires review. Historical Git commits may still contain retired references; current `main` is authoritative.

## Security rules

- Client: publishable Supabase credentials only.
- Server: service-role/provider secrets only in server-side secret stores.
- Use narrow RPCs/Edge Functions with explicit authorization.
- Keep brand/entity attribution in KOLLECTIVE BOH; do not route multi-brand state through a generic external workflow.
- Do not rely on completion reports or old implementation docs as production truth.

## Operational monitoring

Monitor the actual live components:
- Supabase database/RLS/security advisors
- active Edge Functions
- pg_cron jobs
- app/deployment logs
- GitHub CI/build checks
- direct provider health where a provider is genuinely used

There is no n8n dashboard requirement in the current BOH architecture.

---
**Status:** Direct-first production architecture
