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
