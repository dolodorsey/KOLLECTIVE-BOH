-- KOLLECTIVE BOH — Outreach Account Persistence Engine
-- Source mirror of production objects applied 2026-09-21.
-- Data imports (sponsor/VC/Casper target records) are operational data and are intentionally not embedded here.

create table if not exists public.outreach_lane_policies (
  lane text primary key,
  entity_key text,
  channel_policy jsonb not null default '{}'::jsonb,
  contact_rotation jsonb not null default '[]'::jsonb,
  max_touches_per_contact integer not null default 3 check (max_touches_per_contact between 1 and 10),
  followup_delay_hours integer not null default 72 check (followup_delay_hours between 1 and 720),
  switch_after_hours integer not null default 168 check (switch_after_hours between 1 and 1440),
  success_criterion text not null,
  stop_conditions jsonb not null default '[]'::jsonb,
  owner_role text,
  closer_role text,
  active boolean not null default true,
  metadata jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.outreach_accounts (
  id uuid primary key default gen_random_uuid(),
  entity_key text not null,
  lane text not null references public.outreach_lane_policies(lane),
  account_name text not null,
  account_type text,
  parent_account_name text,
  website text,
  city text,
  state text,
  country text not null default 'USA',
  source_type text,
  source_url text,
  source_external_id text,
  priority_tier text,
  priority_score numeric,
  status text not null default 'research',
  owner_role text,
  owner_name text,
  closer_name text,
  success_criterion text,
  max_contacts integer not null default 8,
  current_contact_id uuid,
  contact_switch_count integer not null default 0,
  last_touch_at timestamptz,
  next_action text,
  next_action_at timestamptz,
  stop_reason text,
  active boolean not null default true,
  source_payload jsonb not null default '{}'::jsonb,
  metadata jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.outreach_account_contacts (
  id uuid primary key default gen_random_uuid(),
  account_id uuid not null references public.outreach_accounts(id) on delete cascade,
  full_name text,
  title text,
  department text,
  email text,
  phone text,
  linkedin text,
  contact_rank integer not null default 100,
  role_fit_score numeric,
  is_decision_maker boolean not null default false,
  department_verified boolean not null default false,
  correct_department boolean,
  contact_status text not null default 'untried',
  attempts integer not null default 0,
  last_touch_at timestamptz,
  next_action_at timestamptz,
  referred_contact_name text,
  referred_contact_email text,
  source_url text,
  do_not_contact boolean not null default false,
  metadata jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

do $$ begin
  if not exists (select 1 from pg_constraint where conname='outreach_accounts_current_contact_id_fkey') then
    alter table public.outreach_accounts
      add constraint outreach_accounts_current_contact_id_fkey
      foreign key (current_contact_id) references public.outreach_account_contacts(id) on delete set null;
  end if;
end $$;

create table if not exists public.outreach_activity (
  id uuid primary key default gen_random_uuid(),
  account_id uuid not null references public.outreach_accounts(id) on delete cascade,
  contact_id uuid references public.outreach_account_contacts(id) on delete set null,
  direction text not null default 'outbound',
  channel text not null,
  activity_type text not null,
  outcome text,
  subject text,
  body_preview text,
  provider text,
  provider_message_id text,
  provider_thread_id text,
  notes text,
  actor text,
  occurred_at timestamptz not null default now(),
  metadata jsonb not null default '{}'::jsonb
);

create table if not exists public.outreach_threads (
  id uuid primary key default gen_random_uuid(),
  account_id uuid not null references public.outreach_accounts(id) on delete cascade,
  contact_id uuid references public.outreach_account_contacts(id) on delete set null,
  provider text not null,
  provider_account text,
  thread_id text not null,
  latest_message_id text,
  subject text,
  status text not null default 'open',
  last_outbound_at timestamptz,
  last_inbound_at timestamptz,
  next_followup_at timestamptz,
  metadata jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique(provider,provider_account,thread_id)
);

create table if not exists public.casper_vendor_onboarding (
  id uuid primary key default gen_random_uuid(),
  vendor_name text not null unique,
  vendor_type text not null,
  priority integer not null default 1,
  required boolean not null default true,
  brand_scope text[] not null default '{}',
  application_url text,
  status text not null default 'not_started',
  owner_name text not null default 'Brianna',
  next_action text,
  next_action_at timestamptz,
  requirements jsonb not null default '{}'::jsonb,
  account_reference text,
  live_location_count integer not null default 0,
  blocker text,
  notes text,
  source_url text,
  source_verified_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists idx_outreach_accounts_lane_status_next on public.outreach_accounts(lane,status,next_action_at) where active=true;
create index if not exists idx_outreach_accounts_entity_lane on public.outreach_accounts(entity_key,lane);
create index if not exists idx_outreach_contacts_account_rank on public.outreach_account_contacts(account_id,contact_status,contact_rank,attempts);
create index if not exists idx_outreach_contacts_email on public.outreach_account_contacts(lower(email)) where email is not null;
create index if not exists idx_outreach_activity_account_time on public.outreach_activity(account_id,occurred_at desc);
create index if not exists idx_outreach_threads_followup on public.outreach_threads(status,next_followup_at) where status='open';
create index if not exists idx_casper_vendor_onboarding_status on public.casper_vendor_onboarding(required,status,priority);

alter table public.outreach_lane_policies enable row level security;
alter table public.outreach_accounts enable row level security;
alter table public.outreach_account_contacts enable row level security;
alter table public.outreach_activity enable row level security;
alter table public.outreach_threads enable row level security;
alter table public.casper_vendor_onboarding enable row level security;

revoke all on public.outreach_lane_policies from anon,authenticated;
revoke all on public.outreach_accounts from anon,authenticated;
revoke all on public.outreach_account_contacts from anon,authenticated;
revoke all on public.outreach_activity from anon,authenticated;
revoke all on public.outreach_threads from anon,authenticated;
revoke all on public.casper_vendor_onboarding from anon,authenticated;

-- function definition unavailable
-- function definition unavailable
-- function definition unavailable

create or replace view public.v_outreach_next_actions with (security_invoker=true) as
select null::uuid as account_id where false;
create or replace view public.v_bri_casper_location_queue with (security_invoker=true) as
select null::uuid as account_id where false;
create or replace view public.v_vc_founder_gmail_queue with (security_invoker=true) as
select null::uuid as account_id where false;

revoke all on public.v_outreach_next_actions from anon,authenticated;
revoke all on public.v_bri_casper_location_queue from anon,authenticated;
revoke all on public.v_vc_founder_gmail_queue from anon,authenticated;

do $$
begin
  if not exists (select 1 from cron.job where jobname='khg-outreach-persistence-sweep') then
    perform cron.schedule('khg-outreach-persistence-sweep','17 * * * *','select public.run_outreach_persistence_sweep();');
  end if;
end $$;
