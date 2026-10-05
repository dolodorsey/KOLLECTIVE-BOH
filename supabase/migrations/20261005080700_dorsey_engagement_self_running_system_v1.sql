-- Dr. Dorsey self-running engagement queue + cadence controller
-- Applied to KOLLECTIVE BOH on 2026-10-05.

create or replace function public.replenish_dorsey_engagement_queue_v1(p_desired_open integer default 500)
returns jsonb
language plpgsql
security definer
set search_path = public
as $$
declare
  v_entity uuid := '7a2c9668-1017-4d5c-8e6c-108958f6d851';
  v_open integer;
  v_need integer;
  v_inserted_actions integer := 0;
begin
  select count(*) into v_open
  from public.social_engagement_actions
  where entity_key='dr-dorsey'
    and status in ('queued','needs_context','drafted','needs_approval','approved');

  v_need := greatest(p_desired_open-v_open,0);
  if v_need=0 then
    return jsonb_build_object('open_before',v_open,'needed',0,'actions_added',0,'open_after',v_open);
  end if;

  with memberships as (
    select
      g.username,
      count(distinct i.audience) as membership_count,
      count(distinct i.audience) filter (where i.audience like 'bridge-%') as bridge_count,
      bool_or(i.audience='superfans') as is_superfan,
      bool_or(i.audience='warm-2plus') as is_warm_2plus,
      bool_or(i.audience='nightlife') as is_nightlife
    from (select distinct username from public.ig_audiences where audience='growth-dolodorsey') g
    join public.ig_audiences i on lower(i.username)=lower(g.username)
    group by g.username
  ),
  candidates as (
    select m.*
    from memberships m
    where not exists (
      select 1
      from public.growth_social_engagement_targets t
      join public.social_engagement_actions a on a.target_id=t.id
      where t.enterprise_entity_id=v_entity
        and t.platform='instagram'
        and t.target_type='account'
        and lower(t.target_value)=lower(m.username)
        and a.entity_key='dr-dorsey'
    )
    order by m.is_superfan desc,m.is_warm_2plus desc,m.bridge_count desc,m.membership_count desc,lower(m.username)
    limit v_need
  )
  insert into public.growth_social_engagement_targets (
    id,enterprise_entity_id,platform,target_type,target_value,target_url,
    audience_overlap_score,relationship_value_score,engagement_priority,
    engagement_modes,daily_touch_cap,cooldown_hours,status,metadata,created_at,updated_at
  )
  select
    gen_random_uuid(),v_entity,'instagram','account',c.username,'https://www.instagram.com/'||c.username||'/',
    least(1.0,0.65+c.membership_count::numeric/30.0),
    least(1.0,0.65+c.bridge_count::numeric/12.0),
    case when c.is_superfan then 100 when c.is_warm_2plus then 96 when c.bridge_count>=4 then 92 when c.is_nightlife then 88 else 82 end,
    array['observe','content_fit_review','contextual_public_engagement'],1,72,'active',
    jsonb_build_object(
      'entity_key','dr-dorsey','activation_brand','dr-dorsey','source','ig-export-20261004',
      'membership_count',c.membership_count,'bridge_count',c.bridge_count,
      'is_superfan',c.is_superfan,'is_warm_2plus',c.is_warm_2plus,'is_nightlife',c.is_nightlife,
      'contact_use','not_granted_by_dataset','cross_brand_contacting',false,'no_mass_engagement',true,'auto_replenished',true
    ),
    now(),now()
  from candidates c
  on conflict (enterprise_entity_id,platform,target_type,target_value)
  do update set
    audience_overlap_score=excluded.audience_overlap_score,
    relationship_value_score=excluded.relationship_value_score,
    engagement_priority=greatest(public.growth_social_engagement_targets.engagement_priority,excluded.engagement_priority),
    metadata=public.growth_social_engagement_targets.metadata||excluded.metadata,
    updated_at=now();

  with available as (
    select
      t.id,t.target_value,t.target_url,t.engagement_priority,t.metadata,
      row_number() over(order by t.engagement_priority desc,lower(t.target_value)) as rn
    from public.growth_social_engagement_targets t
    where t.enterprise_entity_id=v_entity
      and t.platform='instagram'
      and t.target_type='account'
      and not exists (
        select 1 from public.social_engagement_actions a
        where a.entity_key='dr-dorsey' and a.target_id=t.id
      )
    order by t.engagement_priority desc,lower(t.target_value)
    limit v_need
  ),
  ins as (
    insert into public.social_engagement_actions (
      id,enterprise_entity_id,entity_key,platform,target_id,target_handle,target_url,
      action_type,direction,status,approval_required,approval_mode,owner_label,metadata,created_at,updated_at
    )
    select
      gen_random_uuid(),v_entity,'dr-dorsey','instagram',a.id,a.target_value,a.target_url,
      'research','outbound','needs_context',false,'entity_policy','Muse / Social Growth',
      jsonb_build_object(
        'wave','dorsey-auto-'||to_char(now(),'YYYYMMDD'),
        'queue_block',ceil(a.rn/20.0),'queue_rank',a.rn,
        'research_owner',case when (a.rn-1)%20<10 then 'muse' when (a.rn-1)%20<15 then 'chatgpt' when (a.rn-1)%20<18 then 'dot' else 'claude' end,
        'live_context_required',true,'action_selection_pending',true,'no_duplicate_writer',true,
        'instruction','Inspect current public context first. Then choose the lightest genuine action. No action is valid. Never infer context from username alone.'
      ),
      now(),now()
    from available a
    returning id
  )
  select count(*) into v_inserted_actions from ins;

  select count(*) into v_open
  from public.social_engagement_actions
  where entity_key='dr-dorsey'
    and status in ('queued','needs_context','drafted','needs_approval','approved');

  return jsonb_build_object('needed',v_need,'actions_added',v_inserted_actions,'open_after',v_open);
end;
$$;

revoke all on function public.replenish_dorsey_engagement_queue_v1(integer) from public;
grant execute on function public.replenish_dorsey_engagement_queue_v1(integer) to authenticated;
grant execute on function public.replenish_dorsey_engagement_queue_v1(integer) to service_role;

create or replace function public.advance_dorsey_engagement_cadence_v1()
returns jsonb
language plpgsql
security definer
set search_path=public
as $$
declare
  v_rec record;
  v_next text;
  v_comment int; v_story int; v_dm int; v_total int; v_60 int; v_4h int;
begin
  select * into v_rec from public.v_social_engagement_ramp_review_v1 where entity_key='dr-dorsey';

  if v_rec.ramp_recommendation='eligible_for_ramp_1' then
    v_next:='ramp_1'; v_comment:=8; v_story:=5; v_dm:=2; v_total:=14; v_60:=2; v_4h:=5;
  elsif v_rec.ramp_recommendation='eligible_for_steady_safe' then
    v_next:='steady_safe'; v_comment:=12; v_story:=6; v_dm:=3; v_total:=18; v_60:=2; v_4h:=6;
  else
    return jsonb_build_object('advanced',false,'phase',v_rec.phase,'recommendation',v_rec.ramp_recommendation);
  end if;

  update public.social_engagement_cadence_policies
  set phase=v_next,phase_started_at=now(),
      next_review_at=case when v_next='ramp_1' then now()+interval '96 hours' else now()+interval '7 days' end,
      comment_cap_day=v_comment,story_cap_day=v_story,dm_cap_day=v_dm,total_external_cap_day=v_total,
      rolling_60m_cap=v_60,rolling_4h_cap=v_4h,updated_at=now()
  where entity_key='dr-dorsey';

  insert into public.social_engagement_cadence_events(entity_key,event_type,severity,provider,evidence,occurred_at)
  values('dr-dorsey','phase_change','info','internal_system',
    jsonb_build_object('new_phase',v_next,'comments_day',v_comment,'stories_day',v_story,'dms_day',v_dm,'total_day',v_total),now());

  return jsonb_build_object('advanced',true,'phase',v_next,'comments_day',v_comment,'stories_day',v_story,'dms_day',v_dm,'total_day',v_total);
end;
$$;

revoke all on function public.advance_dorsey_engagement_cadence_v1() from public;
grant execute on function public.advance_dorsey_engagement_cadence_v1() to authenticated;
grant execute on function public.advance_dorsey_engagement_cadence_v1() to service_role;

create or replace view public.v_dorsey_engagement_system_health_v1
with (security_invoker=true)
as
select
  'dr-dorsey'::text as entity_key,
  now() as checked_at,
  (select count(*) from public.social_engagement_actions where entity_key='dr-dorsey' and status in ('queued','needs_context','drafted','needs_approval','approved')) as open_queue,
  (select count(*) from public.social_engagement_actions where entity_key='dr-dorsey' and status='needs_context') as needs_context,
  (select count(*) from public.social_engagement_actions where entity_key='dr-dorsey' and executed_at is not null) as executed_total,
  (select count(*) from public.social_engagement_learning_events where entity_key='dr-dorsey') as learning_events,
  (select count(*) from public.social_engagement_voice_patterns where entity_key='dr-dorsey' and active) as voice_patterns,
  (select count(*) from public.social_engagement_action_menu where entity_key='dr-dorsey' and active) as action_options,
  c.phase as cadence_phase,c.proactive_action_allowed,c.gate_reason,
  c.total_today,c.total_external_cap_day,c.total_60m,c.rolling_60m_cap,c.total_4h,c.rolling_4h_cap,
  r.ramp_recommendation,r.provider_backed_actions_in_phase,r.risk_events_in_phase
from public.v_social_engagement_cadence_state_v1 c
join public.v_social_engagement_ramp_review_v1 r using(entity_key)
where c.entity_key='dr-dorsey';

grant select on public.v_dorsey_engagement_system_health_v1 to authenticated;
grant select on public.v_dorsey_engagement_system_health_v1 to service_role;
