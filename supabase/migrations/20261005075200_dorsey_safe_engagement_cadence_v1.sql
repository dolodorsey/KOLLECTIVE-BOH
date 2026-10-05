-- Dr. Dorsey safe engagement cadence v1
-- Conservative internal safety controls; these are not official Instagram limits.

create table if not exists public.social_engagement_cadence_policies (
  entity_key text primary key,
  timezone text not null default 'America/New_York',
  phase text not null check (phase in ('ramp_0','ramp_1','steady_safe','paused')),
  phase_started_at timestamptz not null default now(),
  next_review_at timestamptz,
  comment_cap_day integer not null default 6 check (comment_cap_day >= 0),
  story_cap_day integer not null default 4 check (story_cap_day >= 0),
  dm_cap_day integer not null default 1 check (dm_cap_day >= 0),
  total_external_cap_day integer not null default 10 check (total_external_cap_day >= 0),
  rolling_60m_cap integer not null default 2 check (rolling_60m_cap >= 0),
  rolling_4h_cap integer not null default 4 check (rolling_4h_cap >= 0),
  min_gap_minutes integer not null default 20 check (min_gap_minutes >= 0),
  dm_min_gap_minutes integer not null default 120 check (dm_min_gap_minutes >= 0),
  target_cooldown_hours integer not null default 72 check (target_cooldown_hours >= 0),
  max_target_touches_7d integer not null default 2 check (max_target_touches_7d >= 0),
  max_unanswered_dm_followups integer not null default 1 check (max_unanswered_dm_followups >= 0),
  proactive_start_local time not null default '09:00',
  proactive_end_local time not null default '23:00',
  auto_pause_on_provider_warning boolean not null default true,
  warning_pause_hours integer not null default 24 check (warning_pause_hours >= 0),
  action_block_pause_hours integer not null default 72 check (action_block_pause_hours >= 0),
  paused_until timestamptz,
  pause_reason text,
  metadata jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.social_engagement_cadence_events (
  id uuid primary key default gen_random_uuid(),
  entity_key text not null,
  event_type text not null check (event_type in ('provider_warning','action_block','rate_limit','manual_pause','manual_resume','clean_review','phase_change')),
  severity text not null default 'info' check (severity in ('info','warning','critical')),
  provider text,
  evidence jsonb not null default '{}'::jsonb,
  occurred_at timestamptz not null default now(),
  created_at timestamptz not null default now()
);

create index if not exists social_engagement_cadence_events_entity_time_idx
  on public.social_engagement_cadence_events(entity_key,occurred_at desc);

alter table public.social_engagement_cadence_policies enable row level security;
alter table public.social_engagement_cadence_events enable row level security;

drop policy if exists social_engagement_cadence_policies_boh_all on public.social_engagement_cadence_policies;
create policy social_engagement_cadence_policies_boh_all
on public.social_engagement_cadence_policies
for all to authenticated
using (private.is_boh_operator())
with check (private.is_boh_operator());

drop policy if exists social_engagement_cadence_policies_service_all on public.social_engagement_cadence_policies;
create policy social_engagement_cadence_policies_service_all
on public.social_engagement_cadence_policies
for all to service_role
using (true)
with check (true);

drop policy if exists social_engagement_cadence_events_boh_all on public.social_engagement_cadence_events;
create policy social_engagement_cadence_events_boh_all
on public.social_engagement_cadence_events
for all to authenticated
using (private.is_boh_operator())
with check (private.is_boh_operator());

drop policy if exists social_engagement_cadence_events_service_all on public.social_engagement_cadence_events;
create policy social_engagement_cadence_events_service_all
on public.social_engagement_cadence_events
for all to service_role
using (true)
with check (true);

insert into public.social_engagement_cadence_policies (
  entity_key,timezone,phase,phase_started_at,next_review_at,
  comment_cap_day,story_cap_day,dm_cap_day,total_external_cap_day,
  rolling_60m_cap,rolling_4h_cap,min_gap_minutes,dm_min_gap_minutes,
  target_cooldown_hours,max_target_touches_7d,max_unanswered_dm_followups,
  proactive_start_local,proactive_end_local,auto_pause_on_provider_warning,
  warning_pause_hours,action_block_pause_hours,metadata
)
values (
  'dr-dorsey','America/New_York','ramp_0',now(),now()+interval '72 hours',
  6,4,1,10,2,4,20,120,72,2,1,'09:00','23:00',true,24,72,
  jsonb_build_object(
    'policy_kind','conservative_internal_safety_policy',
    'not_official_instagram_limit',true,
    'phase_ladder',jsonb_build_array(
      jsonb_build_object('phase','ramp_0','minimum_clean_hours',72,'minimum_provider_backed_actions',15,'comments_day',6,'stories_day',4,'dms_day',1,'total_day',10,'rolling_60m',2,'rolling_4h',4),
      jsonb_build_object('phase','ramp_1','minimum_clean_hours',96,'minimum_provider_backed_actions',30,'comments_day',8,'stories_day',5,'dms_day',2,'total_day',14,'rolling_60m',2,'rolling_4h',5),
      jsonb_build_object('phase','steady_safe','comments_day',12,'stories_day',6,'dms_day',3,'total_day',18,'rolling_60m',2,'rolling_4h',6)
    ),
    'no_bursting',true,
    'no_rate_limit_evasion',true,
    'no_cold_mass_dm',true,
    'manual_dm_approval',true
  )
)
on conflict (entity_key) do nothing;

create or replace function public.social_engagement_apply_cadence_event()
returns trigger
language plpgsql
as $$
declare
  pause_for interval;
  prior_phase text;
begin
  if new.event_type in ('provider_warning','rate_limit','action_block') then
    select phase into prior_phase
    from public.social_engagement_cadence_policies
    where entity_key=new.entity_key;

    pause_for := case
      when new.event_type='action_block' then
        make_interval(hours => coalesce((select action_block_pause_hours from public.social_engagement_cadence_policies where entity_key=new.entity_key),72))
      else
        make_interval(hours => coalesce((select warning_pause_hours from public.social_engagement_cadence_policies where entity_key=new.entity_key),24))
    end;

    update public.social_engagement_cadence_policies
    set phase='paused',
        paused_until=greatest(coalesce(paused_until,now()),now()+pause_for),
        pause_reason=new.event_type,
        metadata=coalesce(metadata,'{}'::jsonb) || jsonb_build_object(
          'phase_before_pause',coalesce(prior_phase,'ramp_0'),
          'last_pause_event_id',new.id,
          'last_pause_event_at',new.occurred_at
        ),
        updated_at=now()
    where entity_key=new.entity_key;
  elsif new.event_type='manual_resume' then
    update public.social_engagement_cadence_policies
    set phase=coalesce(metadata->>'phase_before_pause','ramp_0'),
        phase_started_at=now(),
        next_review_at=now()+interval '72 hours',
        paused_until=null,
        pause_reason=null,
        updated_at=now()
    where entity_key=new.entity_key;
  end if;
  return new;
end;
$$;

drop trigger if exists trg_social_engagement_apply_cadence_event on public.social_engagement_cadence_events;
create trigger trg_social_engagement_apply_cadence_event
after insert on public.social_engagement_cadence_events
for each row execute function public.social_engagement_apply_cadence_event();

create or replace view public.v_social_engagement_cadence_state_v1
with (security_invoker=true)
as
with policy as (
  select * from public.social_engagement_cadence_policies
),
counts as (
  select
    p.entity_key,
    count(a.id) filter (
      where a.executed_at >= date_trunc('day', now() at time zone p.timezone) at time zone p.timezone
        and a.action_type='comment'
    ) as comments_today,
    count(a.id) filter (
      where a.executed_at >= date_trunc('day', now() at time zone p.timezone) at time zone p.timezone
        and a.action_type in ('story_reply','story_reaction')
    ) as stories_today,
    count(a.id) filter (
      where a.executed_at >= date_trunc('day', now() at time zone p.timezone) at time zone p.timezone
        and a.action_type='dm'
    ) as dms_today,
    count(a.id) filter (
      where a.executed_at >= date_trunc('day', now() at time zone p.timezone) at time zone p.timezone
    ) as total_today,
    count(a.id) filter (where a.executed_at >= now()-interval '60 minutes') as total_60m,
    count(a.id) filter (where a.executed_at >= now()-interval '4 hours') as total_4h,
    max(a.executed_at) as last_external_action_at,
    max(a.executed_at) filter (where a.action_type='dm') as last_dm_at
  from policy p
  left join public.social_engagement_actions a on a.entity_key=p.entity_key
  group by p.entity_key
),
warnings as (
  select
    p.entity_key,
    max(e.occurred_at) filter (where e.event_type in ('provider_warning','action_block','rate_limit')) as last_warning_at,
    count(e.id) filter (
      where e.event_type in ('provider_warning','action_block','rate_limit')
        and e.occurred_at >= p.phase_started_at
    ) as warnings_in_phase
  from policy p
  left join public.social_engagement_cadence_events e on e.entity_key=p.entity_key
  group by p.entity_key
)
select
  p.*,
  coalesce(c.comments_today,0) as comments_today,
  coalesce(c.stories_today,0) as stories_today,
  coalesce(c.dms_today,0) as dms_today,
  coalesce(c.total_today,0) as total_today,
  coalesce(c.total_60m,0) as total_60m,
  coalesce(c.total_4h,0) as total_4h,
  c.last_external_action_at,
  c.last_dm_at,
  w.last_warning_at,
  coalesce(w.warnings_in_phase,0) as warnings_in_phase,
  case
    when p.phase='paused' then false
    when p.paused_until is not null and p.paused_until > now() then false
    when coalesce(c.total_today,0) >= p.total_external_cap_day then false
    when coalesce(c.total_60m,0) >= p.rolling_60m_cap then false
    when coalesce(c.total_4h,0) >= p.rolling_4h_cap then false
    when c.last_external_action_at is not null and c.last_external_action_at > now() - make_interval(mins=>p.min_gap_minutes) then false
    when (now() at time zone p.timezone)::time < p.proactive_start_local then false
    when (now() at time zone p.timezone)::time > p.proactive_end_local then false
    else true
  end as proactive_action_allowed,
  case
    when p.phase='paused' then 'phase_paused'
    when p.paused_until is not null and p.paused_until > now() then 'temporary_pause'
    when coalesce(c.total_today,0) >= p.total_external_cap_day then 'daily_total_cap'
    when coalesce(c.total_60m,0) >= p.rolling_60m_cap then 'rolling_60m_cap'
    when coalesce(c.total_4h,0) >= p.rolling_4h_cap then 'rolling_4h_cap'
    when c.last_external_action_at is not null and c.last_external_action_at > now() - make_interval(mins=>p.min_gap_minutes) then 'minimum_gap'
    when (now() at time zone p.timezone)::time < p.proactive_start_local then 'before_proactive_window'
    when (now() at time zone p.timezone)::time > p.proactive_end_local then 'after_proactive_window'
    else 'allowed'
  end as gate_reason,
  (
    coalesce(c.comments_today,0) < p.comment_cap_day
    and p.phase <> 'paused'
    and not (p.paused_until is not null and p.paused_until > now())
    and coalesce(c.total_today,0) < p.total_external_cap_day
    and coalesce(c.total_60m,0) < p.rolling_60m_cap
    and coalesce(c.total_4h,0) < p.rolling_4h_cap
    and (c.last_external_action_at is null or c.last_external_action_at <= now() - make_interval(mins=>p.min_gap_minutes))
    and (now() at time zone p.timezone)::time between p.proactive_start_local and p.proactive_end_local
  ) as comment_allowed,
  (
    coalesce(c.stories_today,0) < p.story_cap_day
    and p.phase <> 'paused'
    and not (p.paused_until is not null and p.paused_until > now())
    and coalesce(c.total_today,0) < p.total_external_cap_day
    and coalesce(c.total_60m,0) < p.rolling_60m_cap
    and coalesce(c.total_4h,0) < p.rolling_4h_cap
    and (c.last_external_action_at is null or c.last_external_action_at <= now() - make_interval(mins=>p.min_gap_minutes))
    and (now() at time zone p.timezone)::time between p.proactive_start_local and p.proactive_end_local
  ) as story_allowed,
  (
    coalesce(c.dms_today,0) < p.dm_cap_day
    and p.phase <> 'paused'
    and not (p.paused_until is not null and p.paused_until > now())
    and coalesce(c.total_today,0) < p.total_external_cap_day
    and coalesce(c.total_60m,0) < p.rolling_60m_cap
    and coalesce(c.total_4h,0) < p.rolling_4h_cap
    and (c.last_external_action_at is null or c.last_external_action_at <= now() - make_interval(mins=>p.min_gap_minutes))
    and (c.last_dm_at is null or c.last_dm_at <= now() - make_interval(mins=>p.dm_min_gap_minutes))
    and (now() at time zone p.timezone)::time between p.proactive_start_local and p.proactive_end_local
  ) as dm_allowed
from policy p
left join counts c on c.entity_key=p.entity_key
left join warnings w on w.entity_key=p.entity_key;

grant select on public.v_social_engagement_cadence_state_v1 to authenticated;
grant select on public.v_social_engagement_cadence_state_v1 to service_role;

create or replace view public.v_social_engagement_ramp_review_v1
with (security_invoker=true)
as
with p as (
  select * from public.social_engagement_cadence_policies
),
e as (
  select
    p.entity_key,
    count(a.id) filter (
      where a.executed_at >= p.phase_started_at
        and a.external_id is not null
    ) as provider_backed_actions_in_phase,
    count(a.id) filter (
      where a.executed_at >= p.phase_started_at
        and a.replied_at is not null
    ) as replies_in_phase,
    count(a.id) filter (
      where a.executed_at >= p.phase_started_at
        and a.status='converted'
    ) as conversions_in_phase
  from p
  left join public.social_engagement_actions a on a.entity_key=p.entity_key
  group by p.entity_key
),
w as (
  select
    p.entity_key,
    count(c.id) filter (
      where c.event_type in ('provider_warning','action_block','rate_limit')
        and c.occurred_at >= p.phase_started_at
    ) as risk_events_in_phase
  from p
  left join public.social_engagement_cadence_events c on c.entity_key=p.entity_key
  group by p.entity_key
)
select
  p.entity_key,
  p.phase,
  p.phase_started_at,
  p.next_review_at,
  e.provider_backed_actions_in_phase,
  e.replies_in_phase,
  e.conversions_in_phase,
  w.risk_events_in_phase,
  case
    when p.phase='ramp_0'
      and now() >= p.phase_started_at + interval '72 hours'
      and e.provider_backed_actions_in_phase >= 15
      and w.risk_events_in_phase=0
      then 'eligible_for_ramp_1'
    when p.phase='ramp_1'
      and now() >= p.phase_started_at + interval '96 hours'
      and e.provider_backed_actions_in_phase >= 30
      and w.risk_events_in_phase=0
      then 'eligible_for_steady_safe'
    when p.phase='paused' then 'paused_review_required'
    else 'hold_current_phase'
  end as ramp_recommendation
from p
left join e on e.entity_key=p.entity_key
left join w on w.entity_key=p.entity_key;

grant select on public.v_social_engagement_ramp_review_v1 to authenticated;
grant select on public.v_social_engagement_ramp_review_v1 to service_role;
