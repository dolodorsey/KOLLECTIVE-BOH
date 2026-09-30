CREATE OR REPLACE FUNCTION public.refresh_communication_send_ramp_v1()
 RETURNS jsonb
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public', 'pg_temp'
AS $function$
declare
  r record; s record; m record; f record;
  new_status text; cap int; next_cap int; new_stage int; why text;
  desired_cap int; scale_time timestamptz; changed int:=0; metrics jsonb;
begin
  perform pg_advisory_xact_lock(hashtext('communication-send-ramp-refresh-v1'));

  for r in
    select rs.*, d.entity_key,
           er.route_status,
           coalesce(er.daily_cap,0) as route_daily_cap
    from public.communication_send_ramp_state rs
    join public.enterprise_directory_records d on d.id=rs.enterprise_entity_id
    left join public.enterprise_entity_sender_routes er
      on er.entity_key=d.entity_key
     and er.channel='email'
     and er.stream='marketing'
     and er.active=true
    where rs.stream='email_marketing'
      and exists(
        select 1 from public.v_current_focus_scope_manifest_v1 scope
        where scope.entity_key=d.entity_key
      )
    for update of rs
  loop
    select count(*)::int as ready,
           coalesce(min(coalesce(sp.daily_cap,10)),0)::int as sender_cap
    into s
    from public.communication_sender_profiles sp
    where sp.brand_key=r.entity_key
      and sp.channel='email'
      and sp.stream='marketing'
      and sp.verified
      and sp.sending_enabled
      and sp.connection_status='connected'
      and coalesce(sp.metadata->>'transport_blocker','')=''
      and (
        lower(coalesce(sp.provider,'')) not in ('highlevel','ghl','gohighlevel','highlevel_gateway')
        or public.ghl_exact_location_pit_ready_v1(r.entity_key)
      );

    select
      count(*) filter(
        where lower(l.status) in ('accepted','submitted','delivered')
          and nullif(btrim(l.provider_message_id),'') is not null
      )::int as accepted,
      count(*) filter(where lower(l.status) in ('failed','rejected','bounced','error'))::int as failures,
      count(*) filter(where coalesce(l.error_message,'') ~* '(429|throttl|rate.limit)')::int as throttles,
      count(*) filter(where lower(l.status)='delivered')::int as delivered_log,
      max(l.submitted_at) filter(
        where lower(l.status) in ('accepted','submitted','delivered')
          and nullif(btrim(l.provider_message_id),'') is not null
      ) as last_receipt
    into m
    from public.communication_send_log l
    join public.communication_sender_profiles sp
      on sp.id=l.sender_profile_id
     and sp.brand_key=r.entity_key
     and sp.channel='email'
     and sp.stream='marketing'
     and sp.verified
     and sp.sending_enabled
     and sp.connection_status='connected'
     and coalesce(sp.metadata->>'transport_blocker','')=''
     and (
       lower(coalesce(sp.provider,''))=lower(coalesce(l.provider,''))
       or (
         lower(coalesce(sp.provider,'')) in ('highlevel','ghl','gohighlevel','highlevel_gateway')
         and lower(coalesce(l.provider,'')) in ('highlevel','ghl','gohighlevel','highlevel_gateway','highlevel_conversation','highlevel_native_campaign')
       )
     )
     and (
       lower(coalesce(sp.provider,'')) not in ('highlevel','ghl','gohighlevel','highlevel_gateway')
       or public.ghl_exact_location_pit_ready_v1(r.entity_key)
     )
    where l.brand_key=r.entity_key
      and l.channel='email'
      and l.stream='marketing'
      and l.submitted_at>=now()-interval '48 hours'
      and coalesce(l.metadata->>'test','false')<>'true'
      and coalesce(l.metadata->>'is_test','false')<>'true';

    select
      count(*) filter(where lower(e.event_type) in ('delivery','delivered'))::int as delivered,
      count(*) filter(where lower(e.event_type) in ('bounce','bounced'))::int as bounces,
      count(*) filter(where lower(e.event_type) in ('complaint','complained'))::int as complaints,
      count(*) filter(where lower(e.event_type) in ('unsubscribe','unsubscribed'))::int as unsubscribes
    into f
    from public.email_events e
    where e.brand_key=r.entity_key
      and e.event_at>=now()-interval '48 hours';

    desired_cap:=least(
      coalesce(nullif(s.sender_cap,0),0),
      case when coalesce(r.route_daily_cap,0)>0 then r.route_daily_cap else coalesce(nullif(s.sender_cap,0),0) end
    );

    new_status:=r.status;
    new_stage:=r.stage;
    cap:=least(coalesce(r.current_daily_cap,0),coalesce(s.sender_cap,0));
    next_cap:=coalesce(r.next_daily_cap,desired_cap);
    scale_time:=r.last_scale_at;
    why:='awaiting_verified_route';

    if s.ready=0 or s.sender_cap<=0 or coalesce(r.route_status,'blocked')<>'ready' then
      new_status:='blocked_sender';
      cap:=0;
      next_cap:=case when desired_cap>0 then desired_cap else 50 end;
      why:=case
        when coalesce(r.route_status,'blocked')<>'ready' then 'entity_sender_route_not_ready'
        else 'no_verified_connected_company_sender_with_positive_cap'
      end;
    elsif r.status in ('hold','paused') then
      cap:=0;
      why:='existing_hold_requires_review';
    elsif coalesce(m.throttles,0)>0
       or (coalesce(m.failures,0)>0 and 100.0*m.failures/greatest(m.accepted+m.failures,1)>coalesce((r.health_thresholds->>'provider_failure_rate_max_pct')::numeric,2))
       or (coalesce(f.bounces,0)>0 and 100.0*f.bounces/greatest(m.accepted,1)>coalesce((r.health_thresholds->>'bounce_rate_max_pct')::numeric,2.5))
       or (coalesce(f.complaints,0)>0 and 100.0*f.complaints/greatest(m.accepted,1)>coalesce((r.health_thresholds->>'complaint_rate_max_pct')::numeric,0.08))
       or (coalesce(f.unsubscribes,0)>0 and 100.0*f.unsubscribes/greatest(m.accepted,1)>coalesce((r.health_thresholds->>'unsubscribe_rate_max_pct')::numeric,0.75))
    then
      new_status:='hold';
      cap:=0;
      next_cap:=desired_cap;
      why:='delivery_health_threshold_or_throttle';
    else
      new_status:='ready';
      cap:=desired_cap;
      next_cap:=desired_cap;
      new_stage:=case when desired_cap>=1000 then 7 else greatest(r.stage,0) end;
      scale_time:=coalesce(scale_time,now());
      why:=case
        when desired_cap>=1000 then 'verified_route_founder_initial_cap_1000'
        else 'verified_route_sender_cap'
      end;
    end if;

    metrics:=jsonb_build_object(
      'receipts_48h',coalesce(m.accepted,0),
      'failures_48h',coalesce(m.failures,0),
      'delivered_48h',greatest(coalesce(f.delivered,0),coalesce(m.delivered_log,0)),
      'bounces_48h',coalesce(f.bounces,0),
      'complaints_48h',coalesce(f.complaints,0),
      'unsubscribes_48h',coalesce(f.unsubscribes,0),
      'throttles_48h',coalesce(m.throttles,0),
      'operational_senders',coalesce(s.ready,0),
      'sender_daily_cap',coalesce(s.sender_cap,0),
      'route_daily_cap',coalesce(r.route_daily_cap,0),
      'route_status',coalesce(r.route_status,'missing'),
      'decision_reason',why,
      'health_feedback_missing',greatest(coalesce(f.delivered,0),coalesce(m.delivered_log,0))=0,
      'exact_pit_guard',true,
      'provider_alias_mapping',true,
      'refreshed_at',now(),
      'policy_version','20260930_highlevel_execution_v4'
    );

    update public.communication_send_ramp_state
    set status=new_status,
        stage=new_stage,
        current_daily_cap=cap,
        next_daily_cap=next_cap,
        last_scale_at=scale_time,
        last_provider_receipt_at=coalesce(m.last_receipt,last_provider_receipt_at),
        latest_metrics=metrics,
        next_review_at=now()+interval '1 hour',
        updated_at=now()
    where id=r.id;

    changed:=changed+1;
  end loop;

  return jsonb_build_object(
    'ok',true,
    'changed',changed,
    'sends_performed',0,
    'policy_version','20260930_highlevel_execution_v4',
    'at',now()
  );
end;
$function$
;
