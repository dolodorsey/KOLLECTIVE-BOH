-- APPLIED LIVE TO MCP Gateway project dzlmtvodpyhetvektfuo on 2026-09-03.
-- This is an audit/source record. Do not blindly run against the BOH project.
-- Exact per-location PIT only; no shared agency write credential.

create table if not exists public.crm_ghl_pipeline_deployment_receipts (
  id uuid primary key default gen_random_uuid(),
  brand_key text not null,
  ghl_location_id text not null,
  pipeline_name text not null,
  idempotency_key text not null,
  deployment_status text not null,
  ghl_pipeline_id text,
  http_status integer,
  error_excerpt text,
  metadata jsonb not null default '{}'::jsonb,
  attempted_at timestamptz not null default now(),
  unique (brand_key,idempotency_key)
);

-- Live function: public.crm_deploy_ghl_pipeline_batch(text,jsonb,boolean)
-- Behavior:
-- * resolves the entity from crm_messaging_ghl_brand_map
-- * resolves the exact active PIT from ghl_locations
-- * rejects cross-location payloads
-- * maximum batch size 30
-- * dry_run=true performs no network calls
-- * live mode lists existing location pipelines first
-- * same-name pipelines are returned/recorded as already_exists
-- * missing pipelines are created through POST /opportunities/pipelines
-- * receipts persist without exposing the PIT
-- * 401/403 is recorded as scope_blocked
-- * only service_role may execute

-- Dry-run proof completed against Good Times:
-- brand_key=good_times
-- expected location=jbm4vUg0J1llNkK8q6Lt
-- result: ok=true, dry_run=true, network_calls=0,
-- credential_strategy=exact_per_location_pit, validated_location_lock=true.
