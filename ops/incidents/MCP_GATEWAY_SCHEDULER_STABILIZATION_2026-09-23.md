# MCP Gateway Scheduler Stabilization — 2026-09-23

## Incident
GOOD TIMES customer reads began returning PostgREST `PGRST002` / schema-cache 503s and timeouts even though direct Postgres queries remained healthy.

The database was not missing the public schema, had no manual `pgrst.db_schemas` override, and the Postgres notification queue was empty. The Supabase project itself remained `ACTIVE_HEALTHY`.

## Root cause class
The MCP Gateway scheduler was creating an I/O collision storm:
- multiple heavy pg_cron jobs started on the same minute boundaries
- several jobs ran longer than their scheduling interval
- GOOD TIMES collection, materialized view refreshes, contact reconciliation, enrichment, GHL subscriber imports and QA scans overlapped
- the retired Rose scheduler was still running every 2 minutes

Observed examples during the incident included:
- `gt_collect_calendar_feeds_v2()`
- `gt_collect_recovery_calendars_v3()`
- `reconcile_company_full_contact_sync_v1(3000)`
- `sync_newsletter_subscribers_to_ghl_v1(100)`
- `refresh materialized view concurrently mv_gt_venue_taxonomy_directory`
- `gt_reconcile_multicity_direct_refresh()`
- contact enrichment/resolution functions
- bulk preloaded GHL subscriber imports
- multiple QA agents
- `fn_rose_tick_guarded(3)` — obsolete and retired

At peak, 15 pg_cron sessions were simultaneously active and many were waiting on file/buffer I/O.

## Repairs applied

### Retired identity cleanup
- `rose_tick` cron removed.
- Any in-flight `fn_rose_tick_guarded(3)` execution was terminated.
- BOH `rose-guest-interest` Edge Function is now a JWT-protected `410 RETIRED_ENTITY` tombstone.

### GOOD TIMES high-value collection
- structured feed collector: every 5 minutes instead of every minute
- recovery calendar collector: every 30 minutes
- Atlanta coverage auditor: every 30 minutes
- venue taxonomy materialized view: every 15 minutes
- future/multicity reconciliation: once hourly because current public launch is Atlanta only

### Enterprise CRM/contact work
- 3,000-row company contact reconcile: every 15 minutes
- newsletter-to-GHL sync: every 10 minutes, offset from reconcile
- contact enrichment and trusted-relationship resolution shifted to separate minute slots
- bulk subscriber preload imports moved to twice hourly and split from other heavy work

### QA/background maintenance
- high-cost hourly QA agents moved off minute 0
- brand-voice/regression/cron-monitor jobs staggered
- raw-item promotion and heartbeat jobs offset from collection windows

## Current operating rule
Do not schedule heavy database jobs purely by desired freshness. A job must be scheduled against:
1. observed runtime
2. I/O cost
3. overlap with other high-cost jobs
4. customer-facing priority
5. current launch scope

GOOD TIMES Atlanta customer traffic has priority over future-city refresh and background enrichment.

## Customer resilience
GOOD TIMES production now includes:
- Atlanta-only hard gate
- cached Atlanta inventory RPC
- verified embedded Atlanta snapshot fallback
- no customer 503 when PostgREST is temporarily unavailable, provided a current verified snapshot exists
- explicit degraded state instead of false “healthy” claims

The fallback is not a substitute for Data API recovery; it protects customers while the content plane is impaired.
