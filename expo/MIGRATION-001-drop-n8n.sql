-- ============================================================
-- MIGRATION 001 — remove n8n from the BOH data layer
-- Target: the BOH Supabase project (supabase_kollective_boh)
-- Paired with the code change renaming n8n_endpoint -> endpoint_url.
-- Run this BEFORE deploying the migrate/vercel-native branch.
-- ============================================================

-- 1. Rename the column the app writes to.
ALTER TABLE webhook_registry RENAME COLUMN n8n_endpoint TO endpoint_url;

-- 2. Retire every registered endpoint still pointing at the dead n8n instance.
--    drdorsey.app.n8n.cloud returns 404 — these have not fired in weeks.
UPDATE webhook_registry
SET status = 'inactive'
WHERE endpoint_url ILIKE '%n8n.cloud%';

-- 3. Verify nothing active still points at n8n.
-- SELECT workflow_name, endpoint_url, status FROM webhook_registry WHERE endpoint_url ILIKE '%n8n%';
