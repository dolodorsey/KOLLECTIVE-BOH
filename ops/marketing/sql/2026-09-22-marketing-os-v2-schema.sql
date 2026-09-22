-- Marketing OS v2 schema patch applied to Supabase on 2026-09-22.
-- This file records the production change; it is not a generated Supabase CLI migration.

alter table public.company_annual_plans
  add column if not exists engagement_plan jsonb not null default '{}'::jsonb,
  add column if not exists shopify_email_plan jsonb not null default '{}'::jsonb;

alter table public.company_channel_plans
  drop constraint if exists company_channel_plans_channel_check;

alter table public.company_channel_plans
  add constraint company_channel_plans_channel_check
  check (channel = any (array[
    'team_meeting'::text,
    'social_post'::text,
    'engagement'::text,
    'dm'::text,
    'comment'::text,
    'email_outreach'::text,
    'shopify_email'::text,
    'eventbrite'::text,
    'sms_marketing'::text
  ]));
