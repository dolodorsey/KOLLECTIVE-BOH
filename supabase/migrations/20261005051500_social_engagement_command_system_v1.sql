-- Social Engagement Command System v1
-- Generic entity-isolated engagement program + action ledger.
-- First seeded entity: Dr. Dorsey. Additional entities must be added one at a time.

create table if not exists public.social_engagement_programs (
  enterprise_entity_id uuid primary key references public.enterprise_directory_records(id) on delete cascade,
  entity_key text not null unique,
  platform text not null default 'instagram',
  account_handle text,
  status text not null default 'active' check (status in ('active','paused','setup_required','retired')),
  audience_source text,
  activation_goal text,
  comment_enabled boolean not null default true,
  dm_lane_enabled boolean not null default false,
  dm_mode text not null default 'disabled' check (dm_mode in ('disabled','manual_approval','approved_outbound','automated_replies_only')),
  daily_comment_cap integer not null default 8 check (daily_comment_cap >= 0),
  daily_dm_cap integer not null default 0 check (daily_dm_cap >= 0),
  daily_total_cap integer not null default 12 check (daily_total_cap >= 0),
  target_cycle_size integer not null default 100 check (target_cycle_size > 0),
  daily_target_count integer not null default 20 check (daily_target_count > 0),
  cooldown_hours integer not null default 72 check (cooldown_hours >= 0),
  max_unanswered_dm_followups integer not null default 0 check (max_unanswered_dm_followups >= 0),
  stop_on_reply boolean not null default true,
  stop_on_opt_out boolean not null default true,
  metadata jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.social_engagement_actions (
  id uuid primary key default gen_random_uuid(),
  enterprise_entity_id uuid not null references public.enterprise_directory_records(id) on delete cascade,
  entity_key text not null,
  platform text not null default 'instagram',
  target_id uuid references public.growth_social_engagement_targets(id) on delete set null,
  target_handle text not null,
  target_url text,
  action_type text not null check (action_type in ('research','content_fit_review','comment','dm','story_reply','story_reaction','like','save')),
  direction text not null default 'outbound' check (direction in ('outbound','inbound')),
  thread_key text,
  context_url text,
  context_excerpt text,
  draft_text text,
  status text not null default 'queued' check (status in ('queued','needs_context','drafted','needs_approval','approved','executed','replied','converted','skipped','failed')),
  approval_required boolean not null default false,
  approval_mode text not null default 'entity_policy',
  scheduled_for timestamptz,
  executed_at timestamptz,
  replied_at timestamptz,
  outcome text,
  conversion_type text,
  provider text,
  external_id text,
  proof_url text,
  owner_label text,
  metadata jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists social_engagement_actions_entity_status_idx
  on public.social_engagement_actions(entity_key,status,created_at desc);
create index if not exists social_engagement_actions_target_idx
  on public.social_engagement_actions(target_id,created_at desc);
create index if not exists social_engagement_actions_schedule_idx
  on public.social_engagement_actions(entity_key,scheduled_for)
  where scheduled_for is not null;

alter table public.social_engagement_programs enable row level security;
alter table public.social_engagement_actions enable row level security;

drop policy if exists social_engagement_programs_boh_all on public.social_engagement_programs;
create policy social_engagement_programs_boh_all
on public.social_engagement_programs
for all to authenticated
using (private.is_boh_operator())
with check (private.is_boh_operator());

drop policy if exists social_engagement_programs_service_all on public.social_engagement_programs;
create policy social_engagement_programs_service_all
on public.social_engagement_programs
for all to service_role
using (true)
with check (true);

drop policy if exists social_engagement_actions_boh_all on public.social_engagement_actions;
create policy social_engagement_actions_boh_all
on public.social_engagement_actions
for all to authenticated
using (private.is_boh_operator())
with check (private.is_boh_operator());

drop policy if exists social_engagement_actions_service_all on public.social_engagement_actions;
create policy social_engagement_actions_service_all
on public.social_engagement_actions
for all to service_role
using (true)
with check (true);

create or replace view public.v_social_engagement_entity_command_v1
with (security_invoker=true)
as
select
  p.enterprise_entity_id,
  p.entity_key,
  p.platform,
  p.account_handle,
  p.status as program_status,
  p.activation_goal,
  p.comment_enabled,
  p.dm_lane_enabled,
  p.dm_mode,
  p.daily_comment_cap,
  p.daily_dm_cap,
  p.daily_total_cap,
  p.target_cycle_size,
  p.daily_target_count,
  p.cooldown_hours,
  p.max_unanswered_dm_followups,
  count(a.id) filter (where a.status in ('queued','needs_context','drafted','needs_approval','approved')) as open_actions,
  count(a.id) filter (where a.status='needs_approval') as needs_approval,
  count(a.id) filter (where a.created_at >= date_trunc('day',now()) and a.action_type='comment') as comments_planned_today,
  count(a.id) filter (where a.executed_at >= date_trunc('day',now()) and a.action_type='comment') as comments_executed_today,
  count(a.id) filter (where a.created_at >= date_trunc('day',now()) and a.action_type='dm') as dms_planned_today,
  count(a.id) filter (where a.executed_at >= date_trunc('day',now()) and a.action_type='dm') as dms_executed_today,
  count(a.id) filter (where a.replied_at >= date_trunc('day',now())) as replies_today,
  count(a.id) filter (where a.status='converted' and a.updated_at >= date_trunc('day',now())) as conversions_today,
  max(a.executed_at) as last_engagement_at,
  p.metadata,
  p.updated_at
from public.social_engagement_programs p
left join public.social_engagement_actions a on a.enterprise_entity_id=p.enterprise_entity_id
group by p.enterprise_entity_id,p.entity_key,p.platform,p.account_handle,p.status,p.activation_goal,
         p.comment_enabled,p.dm_lane_enabled,p.dm_mode,p.daily_comment_cap,p.daily_dm_cap,p.daily_total_cap,
         p.target_cycle_size,p.daily_target_count,p.cooldown_hours,p.max_unanswered_dm_followups,p.metadata,p.updated_at;

grant select on public.v_social_engagement_entity_command_v1 to authenticated;
grant select on public.v_social_engagement_entity_command_v1 to service_role;

insert into public.social_engagement_programs (
  enterprise_entity_id, entity_key, platform, account_handle, status,
  audience_source, activation_goal, comment_enabled, dm_lane_enabled, dm_mode,
  daily_comment_cap, daily_dm_cap, daily_total_cap, target_cycle_size,
  daily_target_count, cooldown_hours, max_unanswered_dm_followups,
  stop_on_reply, stop_on_opt_out, metadata
)
select
  e.id,'dr-dorsey','instagram','@DOLODORSEY','active',
  'ig-export-20261004',
  'Reactivate warm ecosystem audiences into real @DOLODORSEY relationships through contextual comments first, then manual-approval DMs only when there is a natural signal.',
  true,true,'manual_approval',8,4,12,100,20,72,1,true,true,
  jsonb_build_object(
    'brand_isolation',true,
    'source_pool_size',70860,
    'superfan_pool',165,
    'warm_2plus_pool',2944,
    'comment_strategy','specific, relevant, non-generic, based on live post context',
    'dm_strategy','manual approval only; prioritize after public interaction, reply, story signal, or obvious relationship context',
    'cold_mass_dm',false,
    'mass_commenting',false,
    'existing_account_policy','@DOLODORSEY inbound DM replies remain founder-manual',
    'dashboard_version','v1'
  )
from public.enterprise_directory_records e
where e.entity_key='dr-dorsey'
on conflict (enterprise_entity_id) do nothing;
