CREATE OR REPLACE FUNCTION private.refresh_daily_marketing_email_program_v1()
 RETURNS jsonb
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public', 'private', 'pg_temp'
AS $function$
declare
  rec record;
  v_local_date date;
  v_day_start timestamptz;
  v_day_end timestamptz;
  v_sent_count integer;
  v_campaign_id uuid;
  v_draft_count integer;
  v_offset integer;
  v_draft public.communication_first_send_drafts%rowtype;
  v_sched timestamptz;
  v_tracking jsonb;
  v_meta jsonb;
  v_created integer := 0;
  v_sent_today integer := 0;
  v_blocked_sender integer := 0;
  v_blocked_content integer := 0;
  v_queued integer := 0;
begin
  insert into private.daily_marketing_email_program_v1(
    entity_key,enabled,owner_hold,daily_cap,status,blocker,metadata,updated_at
  )
  select f.entity_key,
         true,
         false,
         least(1000,greatest(1,coalesce(er0.daily_cap,1000))),
         'pending',
         null,
         jsonb_build_object('daily_focus',true,'scope_version',f.scope_version,'synced_at',now()),
         now()
  from public.v_current_focus_scope_manifest_v1 f
  left join public.enterprise_entity_sender_routes er0
    on er0.entity_key=f.entity_key and er0.channel='email' and er0.stream='marketing' and er0.active=true
  where f.daily_focus=true
  on conflict (entity_key) do update set
    enabled=true,
    owner_hold=excluded.owner_hold,
    daily_cap=excluded.daily_cap,
    metadata=coalesce(private.daily_marketing_email_program_v1.metadata,'{}'::jsonb)||excluded.metadata,
    updated_at=now();

  update private.daily_marketing_email_program_v1 p
     set enabled=false,
         status='inactive_not_daily_focus',
         updated_at=now()
   where not exists (
     select 1 from public.v_current_focus_scope_manifest_v1 f
     where f.entity_key=p.entity_key and f.daily_focus=true
   );

  for rec in
    select p.*,
           d.id as enterprise_entity_id,
           d.entity_name,
           er.route_status,
           er.route_provider,
           er.from_address as route_from_address,
           er.reason as route_reason,
           coalesce(er.daily_cap,p.daily_cap) as route_cap,
           sp.id as sender_profile_id,
           sp.from_address as sender_from_address,
           sp.verified as sender_verified,
           sp.sending_enabled,
           sp.connection_status,
           sp.metadata as sender_metadata
    from private.daily_marketing_email_program_v1 p
    join public.enterprise_directory_records d on d.entity_key=p.entity_key
    left join public.enterprise_entity_sender_routes er
      on er.entity_key=p.entity_key and er.channel='email' and er.stream='marketing' and er.active=true
    left join public.communication_sender_profiles sp
      on sp.brand_key=p.entity_key and sp.channel='email' and sp.stream='marketing'
    where p.enabled=true
    order by p.entity_key
  loop
    v_local_date := (now() at time zone rec.timezone)::date;
    v_day_start := (v_local_date::timestamp at time zone rec.timezone);
    v_day_end := ((v_local_date + 1)::timestamp at time zone rec.timezone);

    select count(distinct l.recipient)::int
      into v_sent_count
    from public.communication_send_log l
    where l.brand_key=rec.entity_key
      and l.channel='email'
      and l.stream='marketing'
      and l.submitted_at>=v_day_start
      and l.submitted_at<v_day_end
      and coalesce(l.metadata->>'test','false')<>'true'
      and coalesce(l.metadata->>'is_test','false')<>'true'
      and lower(l.status) in ('submitted','accepted','delivered');

    if coalesce(v_sent_count,0)>0 then
      update private.daily_marketing_email_program_v1
         set status='sent_today',
             blocker=null,
             last_sent_date=v_local_date,
             last_receipt_at=now(),
             metadata=coalesce(metadata,'{}'::jsonb)||jsonb_build_object('sent_today_recipients',v_sent_count,'verified_at',now()),
             updated_at=now()
       where entity_key=rec.entity_key;
      v_sent_today:=v_sent_today+1;
      continue;
    end if;

    if rec.entity_key='s-o-s' then
      update private.daily_marketing_email_program_v1
         set status='manual_daily_outreach',
             blocker='S.O.S. bulk provider audience currently has no provider+consent eligible recipients. Daily email continues through compliance-reviewed one-to-one provider outreach; automated provider bulk remains blocked.',
             audience_mode='manual_provider_outreach',
             metadata=coalesce(metadata,'{}'::jsonb)||jsonb_build_object(
               'bulk_audience_blocked',true,
               'manual_provider_outreach_required',true,
               'automation_allowed',false,
               'checked_at',now()
             ),
             updated_at=now()
       where entity_key=rec.entity_key;
      continue;
    end if;

    if rec.entity_key='fenyx'
       and not exists (
         select 1 from public.fenyx_site_leads fl
         where fl.marketing_consent=true
           and fl.email is not null and btrim(fl.email)<>''
           and coalesce(fl.status,'') !~* '(unsub|opt.?out|suppressed)'
       )
    then
      update private.daily_marketing_email_program_v1
         set status='blocked_audience',
             blocker='No marketing-consented FĚNYX audience exists yet. Sender is Inbox-verified; daily sending begins when a real FĚNYX opt-in is available.',
             metadata=coalesce(metadata,'{}'::jsonb)||jsonb_build_object('audience_blocked',true,'audience_check_source','fenyx_site_leads.marketing_consent','checked_at',now()),
             updated_at=now()
       where entity_key=rec.entity_key;
      continue;
    end if;

    if rec.owner_hold then
      update private.daily_marketing_email_program_v1
         set status='owner_hold',
             blocker=coalesce(rec.route_reason,'Owner hold'),
             updated_at=now()
       where entity_key=rec.entity_key;
      continue;
    end if;

    if coalesce(rec.route_status,'missing')<>'ready'
       or coalesce(rec.sender_verified,false)=false
       or coalesce(rec.sending_enabled,false)=false
       or coalesce(rec.connection_status,'')<>'connected'
       or nullif(btrim(coalesce(rec.sender_from_address,'')),'') is null
    then
      update private.daily_marketing_email_program_v1
         set status='blocked_sender',
             blocker=coalesce(rec.route_reason,'Production marketing sender is not verified/connected.'),
             metadata=coalesce(metadata,'{}'::jsonb)||jsonb_build_object(
               'route_status',coalesce(rec.route_status,'missing'),
               'sender_verified',coalesce(rec.sender_verified,false),
               'sending_enabled',coalesce(rec.sending_enabled,false),
               'connection_status',coalesce(rec.connection_status,'missing'),
               'checked_at',now()
             ),
             updated_at=now()
       where entity_key=rec.entity_key;
      v_blocked_sender:=v_blocked_sender+1;
      continue;
    end if;

    select mc.id into v_campaign_id
    from public.marketing_native_campaigns mc
    where mc.brand_key=rec.entity_key
      and mc.scheduled_for>=v_day_start
      and mc.scheduled_for<v_day_end
      and mc.status in ('ready_for_native_execution','dispatching','scheduled','processing','sending','sent','submitted_complete')
    order by mc.scheduled_for asc
    limit 1;

    if v_campaign_id is not null then
      update private.daily_marketing_email_program_v1
         set status='queued_today',
             blocker=null,
             last_generated_date=v_local_date,
             last_campaign_id=v_campaign_id,
             updated_at=now()
       where entity_key=rec.entity_key;
      v_queued:=v_queued+1;
      v_campaign_id:=null;
      continue;
    end if;

    select count(*)::int into v_draft_count
    from public.communication_first_send_drafts
    where entity_key=rec.entity_key and status='approved';

    if coalesce(v_draft_count,0)=0 then
      update private.daily_marketing_email_program_v1
         set status='blocked_content',
             blocker='No approved daily-ready email draft exists for this entity.',
             updated_at=now()
       where entity_key=rec.entity_key;
      v_blocked_content:=v_blocked_content+1;
      continue;
    end if;

    v_offset := mod(extract(doy from v_local_date)::int, v_draft_count);
    select *
      into v_draft
    from public.communication_first_send_drafts
    where entity_key=rec.entity_key and status='approved'
    order by draft_key
    offset v_offset limit 1;

    v_sched := ((v_local_date::text||' '||rec.send_time::text)::timestamp at time zone rec.timezone);
    if v_sched < now()+interval '5 minutes' then
      v_sched := now()+interval '5 minutes';
    end if;

    v_meta := coalesce(v_draft.metadata,'{}'::jsonb)
      || jsonb_build_object(
        'body',v_draft.text_body,
        'source_draft_id',v_draft.id,
        'source_draft_key',v_draft.draft_key,
        'daily_program',true,
        'daily_program_date',v_local_date,
        'launch_authorized',true,
        'audience_ready',true,
        'initial_send_cap',least(1000,greatest(1,coalesce(rec.route_cap,rec.daily_cap,1000))),
        'contact_gap_hours',72,
        'founder_daily_email_directive','2026-09-30',
        'suppression_consent_rule',v_draft.suppression_consent_rule,
        'generated_at',now()
      );

    if rec.entity_key='good-times' then
      v_meta := v_meta || jsonb_build_object(
        'provider_filter',jsonb_build_object('field','city','operator','eq','value','Atlanta'),
        'market_scope','Atlanta-only'
      );
    elsif rec.entity_key='s-o-s' then
      v_meta := v_meta || jsonb_build_object(
        'required_tag_groups',jsonb_build_array(
          jsonb_build_array('email_opted_in','newsletter_subscriber','consent:explicit'),
          jsonb_build_array('sos-provider','sos-target-provider','audience:service-provider','lt_provider')
        ),
        'forbidden_tags',jsonb_build_array('email_opted_out','do-not-contact','do_not_contact','opted-out'),
        'audience_mode','provider_opted_in_only'
      );
    end if;

    insert into public.marketing_native_campaigns(
      enterprise_entity_id,brand_key,campaign_key,campaign_name,campaign_type,
      audience_segment_key,subject,preheader,primary_cta,destination_url,
      status,provider,scheduled_for,metadata,updated_at
    )
    values(
      rec.enterprise_entity_id,
      rec.entity_key,
      'daily-email:'||to_char(v_local_date,'YYYYMMDD')||':'||rec.entity_key,
      rec.entity_name||' — Daily Marketing — '||to_char(v_local_date,'YYYY-MM-DD'),
      'email_daily_marketing',
      'daily:'||rec.entity_key,
      v_draft.subject,
      v_draft.preheader,
      v_draft.primary_cta,
      v_draft.destination_url,
      'draft',
      'enterprise_email',
      v_sched,
      v_meta,
      now()
    )
    on conflict (campaign_key) do nothing
    returning id into v_campaign_id;

    if v_campaign_id is null then
      select id into v_campaign_id
      from public.marketing_native_campaigns
      where campaign_key='daily-email:'||to_char(v_local_date,'YYYYMMDD')||':'||rec.entity_key;
    end if;

    v_tracking := public.ensure_native_campaign_tracking_v1(v_campaign_id);
    if coalesce((v_tracking->>'ok')::boolean,false)=false then
      update private.daily_marketing_email_program_v1
         set status='blocked_tracking',
             blocker=coalesce(v_tracking->>'error','Tracking link creation failed.'),
             last_campaign_id=v_campaign_id,
             updated_at=now()
       where entity_key=rec.entity_key;
      continue;
    end if;

    update public.marketing_native_campaigns
       set status='ready_for_native_execution',
           updated_at=now()
     where id=v_campaign_id;

    update private.daily_marketing_email_program_v1
       set status='queued_today',
           blocker=null,
           last_generated_date=v_local_date,
           last_campaign_id=v_campaign_id,
           metadata=coalesce(metadata,'{}'::jsonb)||jsonb_build_object('queued_for',v_sched,'queued_at',now()),
           updated_at=now()
     where entity_key=rec.entity_key;

    v_created:=v_created+1;
  end loop;

  return jsonb_build_object(
    'ok',true,
    'created_today',v_created,
    'sent_today_entities',v_sent_today,
    'queued_entities',v_queued,
    'blocked_sender_entities',v_blocked_sender,
    'blocked_content_entities',v_blocked_content,
    'at',now()
  );
end;
$function$
;
