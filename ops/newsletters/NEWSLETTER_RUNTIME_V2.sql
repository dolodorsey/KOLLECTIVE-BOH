-- Newsletter Runtime v2
-- Production behavior deployed 2026-09-22.
-- This file intentionally contains no PIT tokens or provider secrets.

-- Core behavior:
-- 1. newsletter-only warmup measurement
-- 2. never-mailed-first rotation
-- 3. contact gap + rolling 7-day cap
-- 4. exact campaign idempotency
-- 5. provider pipeline readback reconciliation
-- 6. enterprise preload segmentation with DND/unsubscribe controls

-- Runtime function names:
-- public.enqueue_due_ghl_newsletters_v1(integer)
-- public.advance_newsletter_warmup_v1()
-- private.import_preloaded_ghl_subscribers_v2(text, integer)
-- private.reconcile_ghl_pipeline_cache_v1(text)

-- Active cron jobs:
-- khg-owned-products-preload-subscriber-import-v2  */5 * * * *
-- khg-newsletter-subscriber-ghl-sync-v1           */2 * * * *
-- khg-ghl-newsletter-enqueue-v1                   */5 * * * *
-- khg-gtm-ghl-email-dispatch-v1                   */2 * * * *
-- khg-gtm-ghl-email-reconcile-v1                  * * * * *
-- khg-ghl-newsletter-ramp-v1                      17 5 * * *
-- khg-ghl-pipeline-provider-reconcile-v1          37 4 * * *

-- Frequency defaults
-- normal newsletter: 72-hour same-brand gap, max 2 / 7 days
-- event urgency: 24-hour gap, max 3 / 7 days
-- same campaign duplicate: prohibited
-- open-based resend: prohibited

-- Sender warmup ladder
-- 50 -> 75 -> 100 -> 150 -> 250 -> 400 -> 650 -> 1000/day
-- 10 recipients per dispatcher batch


-- 2026-09-23 production start hardening
-- - company full-contact replication is active against the 107,872 provider-valid master-contact target.
-- - newsletter campaign startup uses public.enqueue_one_newsletter_start_v1().
-- - current warmup cap is enforced from brand_ghl_map/email_warmup_schedule at 50/day.
-- - dispatcher cap counts BOTH sending + sent so slow provider receipts cannot overshoot a warmup rung.
-- - pending rows above the warmup cap are cancelled before provider dispatch.
-- - ICONIC / Nightmare may source physical GHL contacts from the authorized Kollective location while keeping ICONIC campaign identity.
-- - S.O.S. Founding Provider campaign remains provider-segment gated even though S.O.S. has full-pool company access.
-- - production startup cohorts launched: Kollective 50, Mission 365 50, Hakuna Matata 50, Good Times 50, Sole Exchange 50, ICONIC 50, S.O.S. provider cohort 12 currently materialized/sendable.
