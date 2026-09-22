-- Production migration applied in Supabase as marketing_os_v3_full_funnel_lanes
alter table public.company_annual_plans
  add column if not exists outreach_plan jsonb not null default '{}'::jsonb,
  add column if not exists creator_plan jsonb not null default '{}'::jsonb,
  add column if not exists partnership_plan jsonb not null default '{}'::jsonb,
  add column if not exists retention_plan jsonb not null default '{}'::jsonb,
  add column if not exists paid_media_plan jsonb not null default '{}'::jsonb,
  add column if not exists reporting_plan jsonb not null default '{}'::jsonb;

alter table public.company_channel_plans
  drop constraint if exists company_channel_plans_channel_check;

alter table public.company_channel_plans
  add constraint company_channel_plans_channel_check
  check (channel = any (array[
    'team_meeting'::text,'social_post'::text,'engagement'::text,'dm'::text,'comment'::text,
    'email_outreach'::text,'shopify_email'::text,'direct_outreach'::text,
    'creator_outreach'::text,'partnership_outreach'::text,'paid_media'::text,
    'retargeting'::text,'referral_retention'::text,'eventbrite'::text,'sms_marketing'::text
  ]));
