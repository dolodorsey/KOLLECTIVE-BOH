-- Dr. Dorsey engagement completion layer
-- Adds source-context enrichment, team ownership, content feedback, provider-proof reconciliation,
-- and explicit signal-to-learning bridges. Database is entity-isolated to Dr. Dorsey for these views.

create or replace view public.v_social_engagement_source_context_v1
with (security_invoker=true)
as
with memberships as (
  select
    lower(username) as username_key,
    count(distinct audience) as membership_count,
    count(distinct audience) filter (where audience like 'bridge-%') as bridge_count,
    bool_or(audience='superfans') as is_superfan,
    bool_or(audience='warm-2plus') as is_warm_2plus,
    bool_or(audience='nightlife') as is_nightlife,
    array_agg(distinct audience order by audience) as audiences
  from public.ig_audiences
  group by lower(username)
)
select
  a.id as action_id,
  a.enterprise_entity_id,
  a.entity_key,
  a.target_id,
  a.target_handle,
  a.status,
  a.action_type,
  t.engagement_priority,
  t.audience_overlap_score,
  t.relationship_value_score,
  m.membership_count,
  m.bridge_count,
  m.is_superfan,
  m.is_warm_2plus,
  m.is_nightlife,
  m.audiences,
  round(
    coalesce(t.engagement_priority,0)
    + case when m.is_superfan then 15 else 0 end
    + case when m.is_warm_2plus then 8 else 0 end
    + least(coalesce(m.bridge_count,0),6) * 1.5
    + least(coalesce(m.membership_count,0),12) * 0.5
  ,2) as research_priority
from public.social_engagement_actions a
left join public.growth_social_engagement_targets t on t.id=a.target_id
left join memberships m on m.username_key=lower(a.target_handle)
where a.entity_key='dr-dorsey';

grant select on public.v_social_engagement_source_context_v1 to authenticated;
grant select on public.v_social_engagement_source_context_v1 to service_role;

create or replace view public.v_social_engagement_team_queue_v1
with (security_invoker=true)
as
select
  a.id,
  a.enterprise_entity_id,
  a.entity_key,
  a.target_handle,
  a.target_url,
  a.action_type,
  a.status,
  a.context_key,
  a.voice_mode,
  a.context_url,
  a.context_excerpt,
  a.draft_text,
  a.copy_qa_status,
  a.executed_at,
  a.replied_at,
  a.conversion_type,
  a.metadata->>'research_owner' as research_owner,
  a.metadata->>'qa_owner' as qa_owner,
  coalesce((a.metadata->>'research_priority')::numeric,0) as research_priority,
  a.metadata,
  a.created_at,
  a.updated_at
from public.social_engagement_actions a
where a.entity_key='dr-dorsey';

grant select on public.v_social_engagement_team_queue_v1 to authenticated;
grant select on public.v_social_engagement_team_queue_v1 to service_role;

create or replace view public.v_dorsey_engagement_content_feedback_v1
with (security_invoker=true)
as
with patterns as (
  select
    p.context_key,
    p.voice_mode,
    p.action_type,
    coalesce(nullif(p.metadata->>'category',''),
      case
        when p.context_key in ('hospitality','venue_opening','restaurant_opening','cocktail_bar','hotel_hospitality','nightlife_promoter') then 'hospitality'
        when p.context_key in ('nightlife_event','nightlife_dj','concert_live','artist_release','music_culture') then 'culture'
        when p.context_key in ('fashion_style','menswear_tailoring','womenswear_detail','sneaker_detail','watch_accessory','beauty_grooming','barber_grooming') then 'style'
        when p.context_key in ('founder_business','build_progress','product_launch','app_tech_launch','team_hiring','partnership_announcement','expansion_opening','real_estate_development') then 'founder'
        when p.context_key in ('travel_lifestyle','airport_travel','destination_city','beach_resort','car_auto') then 'lifestyle'
        when p.context_key in ('creative_design','art_exhibition','photography','video_directing','creator_process','creator_launch','podcast_interview','press_feature','book_release') then 'creative'
        when p.context_key in ('family_personal','fatherhood','birthday_personal','throwback_memory','humor_light') then 'personal'
        else 'general'
      end
    ) as content_pillar,
    coalesce(w.executions,0) as executions,
    coalesce(w.replies,0) as replies,
    coalesce(w.dm_replies,0) as dm_replies,
    coalesce(w.follows,0) as follows,
    coalesce(w.conversions,0) as conversions,
    coalesce(w.learned_weight,1) as learned_weight
  from public.social_engagement_voice_patterns p
  left join public.v_social_engagement_learning_weights_v1 w
    on w.entity_key=p.entity_key
   and w.context_key=p.context_key
   and w.voice_mode=p.voice_mode
   and w.action_type=p.action_type
  where p.entity_key='dr-dorsey' and p.active=true
)
select
  content_pillar,
  count(*) as pattern_count,
  sum(executions) as executions,
  sum(replies) as replies,
  sum(dm_replies) as dm_replies,
  sum(follows) as follows,
  sum(conversions) as conversions,
  round(avg(learned_weight),3) as avg_learned_weight,
  round(max(learned_weight),3) as best_pattern_weight
from patterns
group by content_pillar;

grant select on public.v_dorsey_engagement_content_feedback_v1 to authenticated;
grant select on public.v_dorsey_engagement_content_feedback_v1 to service_role;

create or replace function public.social_engagement_apply_provider_receipt()
returns trigger
language plpgsql
as $$
begin
  if new.engagement_task_id is not null then
    update public.social_engagement_actions
       set executed_at = coalesce(executed_at,new.occurred_at,new.created_at,now()),
           provider = coalesce(new.provider,provider),
           external_id = coalesce(new.external_id,external_id),
           proof_url = coalesce(new.permalink,proof_url),
           status = case
                      when status in ('queued','needs_context','drafted','needs_approval','approved')
                        then 'executed'
                      else status
                    end,
           metadata = coalesce(metadata,'{}'::jsonb) || jsonb_build_object(
             'provider_receipt_id',new.id,
             'provider_status',new.provider_status,
             'provider_receipt_applied_at',now()
           ),
           updated_at=now()
     where id=new.engagement_task_id
       and entity_key=new.entity_key;
  end if;
  return new;
end;
$$;

drop trigger if exists trg_social_engagement_apply_provider_receipt on public.social_execution_receipts;
create trigger trg_social_engagement_apply_provider_receipt
after insert on public.social_execution_receipts
for each row execute function public.social_engagement_apply_provider_receipt();

create or replace view public.v_social_engagement_provider_proof_v1
with (security_invoker=true)
as
select
  a.id as action_id,
  a.entity_key,
  a.target_handle,
  a.action_type,
  a.status,
  a.executed_at,
  a.replied_at,
  a.conversion_type,
  r.id as receipt_id,
  r.provider,
  r.provider_status,
  r.external_id,
  r.permalink,
  r.occurred_at,
  r.raw_receipt
from public.social_engagement_actions a
left join public.social_execution_receipts r
  on r.engagement_task_id=a.id
 and r.entity_key=a.entity_key;

grant select on public.v_social_engagement_provider_proof_v1 to authenticated;
grant select on public.v_social_engagement_provider_proof_v1 to service_role;

create or replace function public.social_engagement_apply_signal_event()
returns trigger
language plpgsql
as $$
declare
  action_uuid uuid;
  signal text := lower(coalesce(new.signal_type,''));
begin
  if coalesce(new.metadata->>'engagement_action_id','') ~* '^[0-9a-f-]{36}$' then
    action_uuid := (new.metadata->>'engagement_action_id')::uuid;

    if signal in ('reply','comment_reply','dm_reply','story_reply') then
      update public.social_engagement_actions
         set replied_at=coalesce(replied_at,new.observed_at,now()),
             status=case when status='converted' then status else 'replied' end,
             outcome=coalesce(outcome,signal),
             metadata=coalesce(metadata,'{}'::jsonb) || jsonb_build_object(
               'growth_signal_event_id',new.id,
               'growth_signal_type',new.signal_type,
               'growth_signal_applied_at',now()
             ),
             updated_at=now()
       where id=action_uuid
         and enterprise_entity_id=new.enterprise_entity_id;
    elsif signal in ('follow','new_follow') then
      update public.social_engagement_actions
         set status='converted',
             conversion_type='follow',
             metadata=coalesce(metadata,'{}'::jsonb) || jsonb_build_object(
               'growth_signal_event_id',new.id,
               'growth_signal_type',new.signal_type,
               'growth_signal_applied_at',now()
             ),
             updated_at=now()
       where id=action_uuid
         and enterprise_entity_id=new.enterprise_entity_id;
    end if;
  end if;
  return new;
end;
$$;

drop trigger if exists trg_social_engagement_apply_signal_event on public.growth_signal_events;
create trigger trg_social_engagement_apply_signal_event
after insert on public.growth_signal_events
for each row execute function public.social_engagement_apply_signal_event();
