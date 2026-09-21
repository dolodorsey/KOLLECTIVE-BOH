-- Corrective runtime/bootstrap migration for the outreach persistence engine.
-- The prior migration creates the base tables. This migration installs the live
-- routing policies, functions, read models, required vendor bootstrap, and native scheduler.

insert into public.outreach_lane_policies
(lane,entity_key,channel_policy,contact_rotation,max_touches_per_contact,followup_delay_hours,switch_after_hours,success_criterion,stop_conditions,owner_role,closer_role,metadata)
values
(
 'sponsor','the-kollective',
 '{"mode":"multi_channel","channels":["email","phone","linkedin"],"rule":"Account stays active when one contact is silent or misrouted; rotate people, not the account."}'::jsonb,
 '["partnerships/sponsorships","experiential","brand marketing","field marketing","marketing vp/cmo","agency","parent company partnerships"]'::jsonb,
 3,72,168,
 'Qualified sponsorship decision-maker reached and founder call booked; then proposal/negotiation through close.',
 '["explicit no from authorized decision-maker","category conflict","budget unavailable after qualified discussion","account routes exhausted","do-not-contact"]'::jsonb,
 'Sponsor Acquisition Manager','Dr. Dorsey',
 '{"wrong_department":"switch_immediately","no_reply":"follow_up_then_switch","mass_blast":false}'::jsonb
),
(
 'vc','the-kollective',
 '{"mode":"founder_1to1_gmail","provider":"gmail","sender":"thedoctordorsey@gmail.com","channels":["email"],"mass_message":false,"threaded_followups":true}'::jsonb,
 '["managing/general partner with thesis fit","partner","principal","platform/operating partner for referral"]'::jsonb,
 2,96,192,
 'Relevant investment partner replies and a founder call is booked.',
 '["explicit pass after thesis review","fund clearly out of scope","do-not-contact","firm routes exhausted"]'::jsonb,
 'Capital & Expansion Manager','Dr. Dorsey',
 '{"personalization_required":true,"verify_current_thesis":true,"verify_current_contact":true,"stale_source_can_seed_research_only":true}'::jsonb
),
(
 'casper_location','casper-group',
 '{"mode":"call_first","channels":["phone","email","linkedin"],"rule":"Brianna routes to owner/GM/operations and books founder call; she does not need to close the economic deal."}'::jsonb,
 '["owner","general manager","director of operations","regional operator","corporate partnerships/real estate"]'::jsonb,
 4,48,120,
 'Owner/GM/operations call with Dr. Dorsey booked, NDA/deal review triggered, site walk scheduled, then signed host agreement.',
 '["signed agreement","explicit authorized no","site physically incompatible","legal/compliance disqualification","account routes exhausted"]'::jsonb,
 'Brianna','Dr. Dorsey',
 '{"oversupply_strategy":true,"target_more_locations_than_initial_need":true,"wrong_department":"switch_immediately"}'::jsonb
),
(
 'casper_vendor','casper-group',
 '{"mode":"onboarding_completion","channels":["web_application","email","phone"],"rule":"Contact is not completion. Required vendor is complete only when account/application is approved and ready for store activation."}'::jsonb,
 '["merchant onboarding","sales","account executive","implementation/support"]'::jsonb,
 4,48,96,
 'Required vendor account approved and ready to activate Casper launch brands/locations.',
 '["approved/live","provider rejects business after escalation","provider unavailable in target market"]'::jsonb,
 'Brianna','Brianna',
 '{"delivery_required":["DoorDash","Uber Eats","Grubhub"],"foodservice_required_count":1}'::jsonb
)
on conflict (lane) do update set
 entity_key=excluded.entity_key,
 channel_policy=excluded.channel_policy,
 contact_rotation=excluded.contact_rotation,
 max_touches_per_contact=excluded.max_touches_per_contact,
 followup_delay_hours=excluded.followup_delay_hours,
 switch_after_hours=excluded.switch_after_hours,
 success_criterion=excluded.success_criterion,
 stop_conditions=excluded.stop_conditions,
 owner_role=excluded.owner_role,
 closer_role=excluded.closer_role,
 metadata=excluded.metadata,
 updated_at=now();

CREATE OR REPLACE FUNCTION public.outreach_select_next_contact(p_account_id uuid)
 RETURNS uuid
 LANGUAGE plpgsql
 SET search_path TO 'public'
AS $function$
declare
  v_contact_id uuid;
begin
  select c.id into v_contact_id
  from public.outreach_account_contacts c
  where c.account_id = p_account_id
    and c.do_not_contact = false
    and c.contact_status in ('untried','active','no_reply','referred')
  order by
    case c.contact_status when 'untried' then 0 when 'referred' then 1 when 'active' then 2 else 3 end,
    c.contact_rank asc,
    c.attempts asc,
    c.last_touch_at nulls first
  limit 1;

  update public.outreach_accounts
  set current_contact_id = v_contact_id,
      next_action = case when v_contact_id is null then 'research_next_contact_route' else 'contact_current_person' end,
      next_action_at = now(),
      updated_at = now()
  where id = p_account_id;

  return v_contact_id;
end;
$function$


CREATE OR REPLACE FUNCTION public.outreach_record_outcome(p_account_id uuid, p_contact_id uuid, p_channel text, p_outcome text, p_notes text DEFAULT NULL::text, p_provider text DEFAULT NULL::text, p_message_id text DEFAULT NULL::text, p_thread_id text DEFAULT NULL::text)
 RETURNS jsonb
 LANGUAGE plpgsql
 SET search_path TO 'public'
AS $function$
declare
  v_policy public.outreach_lane_policies%rowtype;
  v_contact public.outreach_account_contacts%rowtype;
  v_attempts integer;
  v_next_contact uuid;
  v_result jsonb;
begin
  select p.* into v_policy
  from public.outreach_accounts a
  join public.outreach_lane_policies p on p.lane = a.lane
  where a.id = p_account_id and a.active = true;

  if not found then raise exception 'Active outreach account not found'; end if;

  select * into v_contact
  from public.outreach_account_contacts
  where id = p_contact_id and account_id = p_account_id;

  if not found then raise exception 'Contact does not belong to outreach account'; end if;

  v_attempts := coalesce(v_contact.attempts,0) + 1;

  insert into public.outreach_activity(
    account_id, contact_id, direction, channel, activity_type, outcome,
    provider, provider_message_id, provider_thread_id, notes, actor
  )
  values(
    p_account_id, p_contact_id, 'outbound', p_channel, 'contact_outcome',
    lower(p_outcome), p_provider, p_message_id, p_thread_id, p_notes, 'outreach_router'
  );

  update public.outreach_account_contacts
  set attempts=v_attempts,last_touch_at=now(),updated_at=now()
  where id=p_contact_id;

  update public.outreach_accounts
  set last_touch_at=now(),updated_at=now()
  where id=p_account_id;

  case lower(p_outcome)
    when 'wrong_department' then
      update public.outreach_account_contacts
      set contact_status='wrong_department',correct_department=false,next_action_at=null,updated_at=now()
      where id=p_contact_id;
      update public.outreach_accounts
      set current_contact_id=null,contact_switch_count=contact_switch_count+1,status='routing',
          next_action='switch_contact_immediately',next_action_at=now(),updated_at=now()
      where id=p_account_id;
      v_next_contact := public.outreach_select_next_contact(p_account_id);

    when 'misrouted' then
      update public.outreach_account_contacts
      set contact_status='wrong_department',correct_department=false,next_action_at=null,updated_at=now()
      where id=p_contact_id;
      update public.outreach_accounts
      set current_contact_id=null,contact_switch_count=contact_switch_count+1,status='routing',
          next_action='switch_contact_immediately',next_action_at=now(),updated_at=now()
      where id=p_account_id;
      v_next_contact := public.outreach_select_next_contact(p_account_id);

    when 'referred' then
      update public.outreach_account_contacts
      set contact_status='referred',next_action_at=null,updated_at=now()
      where id=p_contact_id;
      update public.outreach_accounts
      set current_contact_id=null,contact_switch_count=contact_switch_count+1,status='routing',
          next_action='add_referral_then_contact',next_action_at=now(),updated_at=now()
      where id=p_account_id;
      v_next_contact := public.outreach_select_next_contact(p_account_id);

    when 'no_reply' then
      if v_attempts >= v_policy.max_touches_per_contact then
        update public.outreach_account_contacts
        set contact_status='no_reply',next_action_at=null,updated_at=now()
        where id=p_contact_id;
        update public.outreach_accounts
        set current_contact_id=null,contact_switch_count=contact_switch_count+1,status='routing',
            next_action='switch_contact_after_no_reply',next_action_at=now(),updated_at=now()
        where id=p_account_id;
        v_next_contact := public.outreach_select_next_contact(p_account_id);
      else
        update public.outreach_account_contacts
        set contact_status='active',
            next_action_at=now()+make_interval(hours=>v_policy.followup_delay_hours),updated_at=now()
        where id=p_contact_id;
        update public.outreach_accounts
        set status='contacting',current_contact_id=p_contact_id,next_action='follow_up_same_contact',
            next_action_at=now()+make_interval(hours=>v_policy.followup_delay_hours),updated_at=now()
        where id=p_account_id;
      end if;

    when 'replied' then
      update public.outreach_account_contacts
      set contact_status='replied',next_action_at=null,updated_at=now()
      where id=p_contact_id;
      update public.outreach_accounts
      set status='engaged',current_contact_id=p_contact_id,
          next_action='qualify_reply_and_book_call',next_action_at=now(),updated_at=now()
      where id=p_account_id;

    when 'correct_decision_maker' then
      update public.outreach_account_contacts
      set contact_status='active',is_decision_maker=true,department_verified=true,
          correct_department=true,next_action_at=null,updated_at=now()
      where id=p_contact_id;
      update public.outreach_accounts
      set status='decision_maker_reached',current_contact_id=p_contact_id,
          next_action='book_founder_call',next_action_at=now(),updated_at=now()
      where id=p_account_id;

    when 'meeting_booked' then
      update public.outreach_account_contacts
      set contact_status='meeting_booked',is_decision_maker=true,next_action_at=null,updated_at=now()
      where id=p_contact_id;
      update public.outreach_accounts
      set status='meeting_booked',current_contact_id=p_contact_id,
          next_action='founder_close_call',next_action_at=now(),updated_at=now()
      where id=p_account_id;

    when 'explicit_no' then
      if v_contact.is_decision_maker or v_contact.correct_department is true then
        update public.outreach_account_contacts
        set contact_status='declined',next_action_at=null,updated_at=now()
        where id=p_contact_id;
        update public.outreach_accounts
        set status='lost',active=false,stop_reason='explicit_no_from_authorized_contact',
            current_contact_id=p_contact_id,next_action=null,next_action_at=null,updated_at=now()
        where id=p_account_id;
      else
        update public.outreach_account_contacts
        set contact_status='wrong_department',correct_department=false,next_action_at=null,updated_at=now()
        where id=p_contact_id;
        update public.outreach_accounts
        set current_contact_id=null,contact_switch_count=contact_switch_count+1,status='routing',
            next_action='switch_contact_after_unqualified_no',next_action_at=now(),updated_at=now()
        where id=p_account_id;
        v_next_contact := public.outreach_select_next_contact(p_account_id);
      end if;

    when 'signed' then
      update public.outreach_account_contacts
      set contact_status='won',next_action_at=null,updated_at=now()
      where id=p_contact_id;
      update public.outreach_accounts
      set status='won',active=false,stop_reason='signed',current_contact_id=p_contact_id,
          next_action=null,next_action_at=null,updated_at=now()
      where id=p_account_id;

    when 'approved' then
      update public.outreach_account_contacts
      set contact_status='won',next_action_at=null,updated_at=now()
      where id=p_contact_id;
      update public.outreach_accounts
      set status='won',active=false,stop_reason='approved',current_contact_id=p_contact_id,
          next_action=null,next_action_at=null,updated_at=now()
      where id=p_account_id;

    else
      update public.outreach_account_contacts
      set contact_status='active',
          next_action_at=now()+make_interval(hours=>v_policy.followup_delay_hours),updated_at=now()
      where id=p_contact_id;
      update public.outreach_accounts
      set status='contacting',current_contact_id=p_contact_id,next_action='follow_up',
          next_action_at=now()+make_interval(hours=>v_policy.followup_delay_hours),updated_at=now()
      where id=p_account_id;
  end case;

  select jsonb_build_object(
    'account_id',a.id,'account_name',a.account_name,'lane',a.lane,'status',a.status,
    'current_contact_id',a.current_contact_id,'next_action',a.next_action,
    'next_action_at',a.next_action_at,'contact_switch_count',a.contact_switch_count
  ) into v_result
  from public.outreach_accounts a where a.id=p_account_id;

  return v_result;
end;
$function$


CREATE OR REPLACE FUNCTION public.run_outreach_persistence_sweep()
 RETURNS jsonb
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public', 'pg_temp'
AS $function$
declare
  v_org_id uuid;
  v_bri_id uuid := '4e14ad1e-40e2-4248-a3ce-9c0f64623d36';
  v_casper_entity uuid := '3c9dffb4-e420-4e66-9ff5-d379f682d998';
  v_casper_agent uuid := 'b282615b-0133-48a9-9623-30b9c85c90c0';
  v_vendor_agent uuid := '0438068a-e2e0-4150-9ae6-3b5780f540df';
  v_today date := (now() at time zone 'America/New_York')::date;
  v_initial_promoted integer := 0;
  v_backfill_promoted integer := 0;
  v_open_locations integer := 0;
  v_signed_locations integer := 0;
  v_location_research integer := 0;
  v_sponsor_research integer := 0;
  v_vendor_tasks integer := 0;
  v_location_task integer := 0;
  v_rec record;
  v_needed integer := 0;
begin
  select id into v_org_id from public.organizations where slug='the-kollective' limit 1;
  if v_org_id is null then
    raise exception 'Canonical organization not found';
  end if;

  -- Initial controlled Casper wave: top 30 active, all remaining viable accounts held in reserve.
  if not exists (
    select 1 from public.outreach_accounts
    where entity_key='casper-group'
      and lane='casper_location'
      and active=true
      and status in ('active_wave','contacting','routing','engaged','decision_maker_reached','meeting_booked')
  ) then
    with ranked as (
      select id,
             row_number() over (
               order by
                 case
                   when priority_tier ilike 'A1%' then 1
                   when priority_tier ilike 'A2%' then 2
                   when priority_tier ilike 'B%' then 3
                   else 4
                 end,
                 priority_score desc nulls last,
                 account_name
             ) rn
      from public.outreach_accounts
      where entity_key='casper-group'
        and lane='casper_location'
        and active=true
        and status='ready'
    )
    update public.outreach_accounts a
    set status=case when r.rn<=30 then 'active_wave' else 'reserve' end,
        next_action=case
          when r.rn<=30 and a.current_contact_id is not null then 'contact_current_route'
          when r.rn<=30 then 'research_owner_gm_ops_route'
          else 'reserve_wait'
        end,
        next_action_at=case when r.rn<=30 then now() else null end,
        metadata=coalesce(a.metadata,'{}'::jsonb) || jsonb_build_object(
          'location_wave_rank',r.rn,
          'location_wave_strategy','30 active routes / reserve bench / backfill on losses until 10 signed starting target'
        ),
        updated_at=now()
    from ranked r
    where a.id=r.id;
    get diagnostics v_initial_promoted=row_count;
  end if;

  select count(*) into v_open_locations
  from public.outreach_accounts
  where entity_key='casper-group'
    and lane='casper_location'
    and active=true
    and status in ('active_wave','contacting','routing','engaged','decision_maker_reached','meeting_booked');

  select count(*) into v_signed_locations
  from public.outreach_accounts
  where entity_key='casper-group'
    and lane='casper_location'
    and status='won';

  -- Backfill reserve only while starting signed target remains unmet.
  if v_open_locations < 30 and v_signed_locations < 10 then
    v_needed := 30 - v_open_locations;
    with promote as (
      select id
      from public.outreach_accounts
      where entity_key='casper-group'
        and lane='casper_location'
        and active=true
        and status='reserve'
      order by
        case
          when priority_tier ilike 'A1%' then 1
          when priority_tier ilike 'A2%' then 2
          when priority_tier ilike 'B%' then 3
          else 4
        end,
        priority_score desc nulls last,
        account_name
      limit v_needed
    )
    update public.outreach_accounts a
    set status='active_wave',
        next_action=case when a.current_contact_id is not null then 'contact_current_route' else 'research_owner_gm_ops_route' end,
        next_action_at=now(),
        metadata=coalesce(a.metadata,'{}'::jsonb)||jsonb_build_object('promoted_from_reserve_at',now()),
        updated_at=now()
    from promote p
    where a.id=p.id;
    get diagnostics v_backfill_promoted=row_count;
  end if;

  -- Active Casper account without a route: try known contact pool first, then mark enrichment need.
  for v_rec in
    select id
    from public.outreach_accounts
    where entity_key='casper-group'
      and lane='casper_location'
      and active=true
      and status in ('active_wave','contacting','routing')
      and current_contact_id is null
  loop
    perform public.outreach_select_next_contact(v_rec.id);
  end loop;

  update public.outreach_accounts a
  set status='routing',
      next_action='research_owner_gm_ops_route',
      next_action_at=now(),
      updated_at=now()
  where a.entity_key='casper-group'
    and a.lane='casper_location'
    and a.active=true
    and a.status in ('active_wave','contacting','routing')
    and a.current_contact_id is null
    and not exists (
      select 1 from public.outreach_account_contacts c
      where c.account_id=a.id and c.do_not_contact=false
    );
  get diagnostics v_location_research=row_count;

  -- Sponsors: never kill account for a single silent/misrouted person. Ensure each active account has a next route.
  for v_rec in
    select id
    from public.outreach_accounts
    where entity_key='the-kollective'
      and lane='sponsor'
      and active=true
      and status not in ('won','lost','exhausted','hold')
      and current_contact_id is null
  loop
    perform public.outreach_select_next_contact(v_rec.id);
  end loop;

  update public.outreach_accounts a
  set status='routing',
      next_action='research_next_sponsor_decision_maker',
      next_action_at=now(),
      updated_at=now()
  where a.entity_key='the-kollective'
    and a.lane='sponsor'
    and a.active=true
    and a.status not in ('won','lost','exhausted','hold')
    and a.current_contact_id is null
    and not exists (
      select 1 from public.outreach_account_contacts c
      where c.account_id=a.id and c.do_not_contact=false
    );
  get diagnostics v_sponsor_research=row_count;

  -- Re-open due follow-up actions without incrementing attempts. Attempts only advance on a recorded real touch.
  update public.outreach_accounts a
  set next_action=case
        when a.lane='vc' then 'review_personalized_gmail_followup'
        when a.lane='sponsor' then 'follow_up_or_rotate_contact'
        when a.lane='casper_location' then 'call_or_follow_up_current_route'
        else a.next_action
      end,
      updated_at=now()
  where a.active=true
    and a.next_action_at is not null
    and a.next_action_at<=now()
    and a.lane in ('vc','sponsor','casper_location');

  -- Keep VC as research/personalized Gmail only. Public firm inboxes stay research-only.
  update public.outreach_accounts
  set next_action='verify_current_fund_thesis_named_partner_and_personal_angle',
      next_action_at=coalesce(next_action_at,now()),
      metadata=coalesce(metadata,'{}'::jsonb)||jsonb_build_object(
        'sender','thedoctordorsey@gmail.com',
        'mass_blast',false,
        'external_send_requires_founder_approval',true
      ),
      updated_at=now()
  where entity_key='the-kollective'
    and lane='vc'
    and active=true
    and status='research';

  -- One consolidated daily Casper location call block for Brianna.
  insert into public.tasks(
    org_id,title,description,status,priority,assigned_to,due_date,
    source_system,source_record_id,campaign_or_project,blocker,next_action,
    completion_percent,enterprise_entity_id,department_key,assigned_agent_id,
    execution_mode,work_kind,dedupe_key,evidence
  )
  select
    v_org_id,
    'Casper Location Call Block — '||to_char(v_today,'Mon DD'),
    'Work the prioritized Casper location queue. Goal: reach owner / GM / operations and book Dr. Dorsey. Do not negotiate final economics. If the contact is wrong, record WRONG DEPARTMENT so the router switches immediately. If no reply, record NO REPLY; the account remains alive and follows the contact-rotation policy. Work only the active wave, not the reserve bench.',
    'pending','urgent',v_bri_id,
    (v_today::timestamp + interval '17 hours') at time zone 'America/New_York',
    'outreach_persistence','casper_location_daily',
    'Casper Group — Location Acquisition',null,
    'Open v_bri_casper_location_queue and work the first 20 due rows; book Dr. Dorsey on qualified owner/GM/ops responses.',
    0,v_casper_entity,'sales_partnerships',v_casper_agent,
    'human','location_outreach',
    'casper-location-call-block:'||v_today::text,
    jsonb_build_object(
      'queue_view','v_bri_casper_location_queue',
      'active_wave_limit',30,
      'daily_call_block_limit',20,
      'starting_signed_target',10,
      'created_by','run_outreach_persistence_sweep',
      'created_at',now()
    )
  where not exists (
    select 1 from public.tasks where dedupe_key='casper-location-call-block:'||v_today::text
  );
  get diagnostics v_location_task=row_count;

  -- Four required vendor onboarding tasks; completion is approval/activation-ready, not "contacted".
  for v_rec in
    select *
    from public.casper_vendor_onboarding
    where required=true and status not in ('approved','live','complete')
  loop
    insert into public.tasks(
      org_id,title,description,status,priority,assigned_to,due_date,
      source_system,source_record_id,campaign_or_project,blocker,next_action,
      completion_percent,enterprise_entity_id,department_key,assigned_agent_id,
      execution_mode,work_kind,dedupe_key,evidence
    )
    values(
      v_org_id,
      'Casper Vendor Onboarding — '||v_rec.vendor_name,
      case
        when v_rec.vendor_type='delivery_marketplace'
          then 'Complete merchant onboarding for '||v_rec.vendor_name||' for Angel Wings, Patty Daddy, Taco Yaki, Espresso Co, and Mojo Juice. Contacted is NOT complete. Completion requires approved merchant relationship and activation-ready account.'
        else 'Open and complete the broadline foodservice customer account. Only one foodservice provider is required. If this provider cannot support the launch footprint/terms, immediately advance to the next broadliner. Completion requires an approved ordering/logistics-ready account.'
      end,
      case when v_rec.blocker is null then 'pending' else 'blocked' end,
      'urgent',v_bri_id,now()+interval '24 hours',
      'outreach_persistence',v_rec.id::text,
      'Casper Group — Vendor Onboarding',v_rec.blocker,v_rec.next_action,
      case when v_rec.status in ('submitted','in_review') then 50 else 0 end,
      v_casper_entity,'procurement_vendor',v_vendor_agent,
      'human','vendor_onboarding',
      'casper-vendor:'||lower(regexp_replace(v_rec.vendor_name,'[^a-zA-Z0-9]+','-','g')),
      jsonb_build_object(
        'vendor_name',v_rec.vendor_name,
        'vendor_type',v_rec.vendor_type,
        'brand_scope',v_rec.brand_scope,
        'application_url',v_rec.application_url,
        'completion_standard','approved_activation_ready',
        'created_by','run_outreach_persistence_sweep'
      )
    )
    on conflict (dedupe_key) do update
      set status=case when excluded.blocker is null then
                        case when tasks.status='completed' then 'completed' else 'pending' end
                      else 'blocked' end,
          priority='urgent',
          assigned_to=v_bri_id,
          due_date=case when tasks.status='completed' then tasks.due_date else now()+interval '24 hours' end,
          blocker=excluded.blocker,
          next_action=excluded.next_action,
          evidence=coalesce(tasks.evidence,'{}'::jsonb)||excluded.evidence,
          updated_at=now();
    v_vendor_tasks := v_vendor_tasks + 1;
  end loop;

  -- Close vendor tasks only when the vendor tracker proves activation-ready.
  update public.tasks t
  set status='completed',
      completion_percent=100,
      completed_at=coalesce(completed_at,now()),
      blocker=null,
      result_summary='Vendor onboarding verified approved / activation-ready in casper_vendor_onboarding.',
      updated_at=now()
  from public.casper_vendor_onboarding v
  where t.dedupe_key='casper-vendor:'||lower(regexp_replace(v.vendor_name,'[^a-zA-Z0-9]+','-','g'))
    and v.status in ('approved','live','complete')
    and t.status<>'completed';

  return jsonb_build_object(
    'ok',true,
    'ran_at',now(),
    'casper_initial_rows_classified',v_initial_promoted,
    'casper_backfill_promoted',v_backfill_promoted,
    'casper_open_routes_before_backfill',v_open_locations,
    'casper_signed',v_signed_locations,
    'casper_accounts_needing_contact_research',v_location_research,
    'sponsor_accounts_needing_contact_research',v_sponsor_research,
    'bri_location_task_created',v_location_task,
    'required_vendor_tasks_touched',v_vendor_tasks
  );
end;
$function$


revoke all on function public.outreach_select_next_contact(uuid) from public,anon,authenticated;
grant execute on function public.outreach_select_next_contact(uuid) to service_role;
revoke all on function public.outreach_record_outcome(uuid,uuid,text,text,text,text,text,text) from public,anon,authenticated;
grant execute on function public.outreach_record_outcome(uuid,uuid,text,text,text,text,text,text) to service_role;
revoke all on function public.run_outreach_persistence_sweep() from public,anon,authenticated;
grant execute on function public.run_outreach_persistence_sweep() to service_role;

create or replace view public.v_outreach_next_actions with (security_invoker=true) as
 SELECT a.id AS account_id,
    a.entity_key,
    a.lane,
    a.account_name,
    a.city,
    a.state,
    a.priority_tier,
    a.priority_score,
    a.status,
    a.owner_name,
    a.closer_name,
    a.current_contact_id,
    c.full_name AS current_contact_name,
    c.title AS current_contact_title,
    c.department AS current_contact_department,
    c.email AS current_contact_email,
    c.phone AS current_contact_phone,
    c.attempts AS current_contact_attempts,
    a.next_action,
    a.next_action_at,
    a.last_touch_at,
    a.contact_switch_count,
    p.max_touches_per_contact,
    p.followup_delay_hours,
    p.switch_after_hours,
    p.success_criterion
   FROM outreach_accounts a
     JOIN outreach_lane_policies p ON p.lane = a.lane
     LEFT JOIN outreach_account_contacts c ON c.id = a.current_contact_id
  WHERE a.active = true AND (a.status <> ALL (ARRAY['won'::text, 'lost'::text, 'exhausted'::text, 'hold'::text]));;

create or replace view public.v_bri_casper_location_queue with (security_invoker=true) as
 SELECT a.id AS account_id,
    a.account_name,
    a.city,
    a.state,
    a.priority_tier,
    a.priority_score,
    a.status,
    a.next_action,
    a.next_action_at,
    c.id AS contact_id,
    c.full_name AS contact_name,
    c.title AS contact_title,
    c.department,
    c.phone,
    c.email,
    c.attempts,
    c.contact_status,
    c.source_url,
    a.contact_switch_count,
    a.metadata ->> 'location_wave_rank'::text AS wave_rank
   FROM outreach_accounts a
     LEFT JOIN outreach_account_contacts c ON c.id = a.current_contact_id
  WHERE a.entity_key = 'casper-group'::text AND a.lane = 'casper_location'::text AND a.active = true AND (a.status = ANY (ARRAY['active_wave'::text, 'contacting'::text, 'routing'::text, 'engaged'::text, 'decision_maker_reached'::text, 'meeting_booked'::text]))
  ORDER BY (
        CASE a.status
            WHEN 'meeting_booked'::text THEN 1
            WHEN 'decision_maker_reached'::text THEN 2
            WHEN 'engaged'::text THEN 3
            WHEN 'routing'::text THEN 4
            WHEN 'contacting'::text THEN 5
            ELSE 6
        END), a.next_action_at NULLS FIRST, a.priority_score DESC NULLS LAST, a.account_name;;

create or replace view public.v_vc_founder_gmail_queue with (security_invoker=true) as
 SELECT a.id AS account_id,
    a.account_name AS firm,
    a.website,
    a.priority_tier,
    a.status,
    a.next_action,
    a.next_action_at,
    a.source_payload,
    a.metadata,
    count(c.id) AS known_routes,
    count(c.id) FILTER (WHERE (c.metadata ->> 'do_not_send_until_named_partner_verified'::text) = 'true'::text) AS public_routes_research_only,
    max(t.last_inbound_at) AS last_inbound_at,
    max(t.last_outbound_at) AS last_outbound_at,
    max(t.next_followup_at) AS next_followup_at
   FROM outreach_accounts a
     LEFT JOIN outreach_account_contacts c ON c.account_id = a.id
     LEFT JOIN outreach_threads t ON t.account_id = a.id AND t.provider = 'gmail'::text
  WHERE a.entity_key = 'the-kollective'::text AND a.lane = 'vc'::text AND a.active = true
  GROUP BY a.id, a.account_name, a.website, a.priority_tier, a.status, a.next_action, a.next_action_at, a.source_payload, a.metadata
  ORDER BY (
        CASE
            WHEN a.priority_tier ~~* 'A1%'::text THEN 1
            ELSE 2
        END), a.next_action_at NULLS FIRST, a.account_name;;

revoke all on public.v_outreach_next_actions from anon,authenticated;
revoke all on public.v_bri_casper_location_queue from anon,authenticated;
revoke all on public.v_vc_founder_gmail_queue from anon,authenticated;

insert into public.casper_vendor_onboarding
(vendor_name,vendor_type,priority,required,brand_scope,application_url,status,owner_name,next_action,requirements,source_url,notes)
values
('DoorDash','delivery_marketplace',1,true,array['Angel Wings','Patty Daddy','Taco Yaki','Espresso Co','Mojo Juice'],
 'https://merchants.doordash.com/en-us','not_started','Brianna','complete_merchant_signup_and_collect_requirements',
 '{"completion":"account approved and activation-ready; outreach alone does not count"}'::jsonb,
 'https://merchants.doordash.com/en-us','Required delivery platform.'),
('Uber Eats','delivery_marketplace',1,true,array['Angel Wings','Patty Daddy','Taco Yaki','Espresso Co','Mojo Juice'],
 'https://merchants.ubereats.com/us/en/s/signup/','not_started','Brianna','complete_merchant_signup_and_collect_requirements',
 '{"completion":"account approved and activation-ready; outreach alone does not count"}'::jsonb,
 'https://merchants.ubereats.com/us/en/s/signup/','Required delivery platform.'),
('Grubhub','delivery_marketplace',1,true,array['Angel Wings','Patty Daddy','Taco Yaki','Espresso Co','Mojo Juice'],
 'https://get.grubhub.com/','not_started','Brianna','complete_merchant_signup_and_collect_requirements',
 '{"completion":"account approved and activation-ready; outreach alone does not count"}'::jsonb,
 'https://get.grubhub.com/','Required delivery platform.'),
('US Foods','foodservice_broadliner',1,true,array['Angel Wings','Patty Daddy','Taco Yaki','Espresso Co','Mojo Juice'],
 'https://www.usfoods.com/','not_started','Brianna','open_customer_account_and_confirm_service_area_terms',
 '{"completion":"customer account approved with ordering/logistics ready; outreach alone does not count","backup_strategy":"advance to alternate broadliner if unavailable or unsuitable"}'::jsonb,
 'https://www.usfoods.com/','Primary broadline foodservice target; only one broadline provider required.')
on conflict (vendor_name) do update set
 vendor_type=excluded.vendor_type,
 priority=excluded.priority,
 required=excluded.required,
 brand_scope=excluded.brand_scope,
 application_url=excluded.application_url,
 owner_name=excluded.owner_name,
 next_action=excluded.next_action,
 requirements=excluded.requirements,
 source_url=excluded.source_url,
 notes=excluded.notes,
 updated_at=now();

do $$
begin
  if not exists (select 1 from cron.job where jobname='khg-outreach-persistence-sweep') then
    perform cron.schedule('khg-outreach-persistence-sweep','17 * * * *','select public.run_outreach_persistence_sweep();');
  end if;
end $$;
