-- GHL newsletter subscriber materialization runtime
-- Deployed to MCP Gateway on 2026-09-22.
-- No credentials or PIT values are stored in this file.

create or replace function public.sync_newsletter_subscribers_to_ghl_v1(p_limit integer default 100)
returns jsonb
language plpgsql
security invoker
set search_path to 'public','extensions','pg_temp'
as $$
declare
  r record;
  resp extensions.http_response;
  body_json jsonb;
  contact_id text;
  v_synced integer:=0;
  v_errors integer:=0;
begin
  if p_limit<1 or p_limit>500 then raise exception 'p_limit must be 1..500'; end if;
  if not pg_try_advisory_xact_lock(hashtextextended('sync_newsletter_subscribers_to_ghl_v1',0)) then
    return jsonb_build_object('ok',true,'state','busy','synced',0);
  end if;

  for r in
    select s.id subscriber_id,s.email,s.name,s.brand_key,s.segment,s.source,s.subscribed_at,
           m.ghl_location_id,m.pit_token
    from public.newsletter_subscribers s
    join public.brand_ghl_map m on m.brand_key=s.brand_key and m.is_active=true
    where s.status='active'
      and s.unsubscribed_at is null
      and nullif(btrim(s.email),'') is not null
      and coalesce(length(m.pit_token),0)>10
      and not exists(
        select 1 from public.ghl_outreach_contacts c
        where lower(btrim(c.email))=lower(btrim(s.email))
          and c.brand_context=s.brand_key
          and c.ghl_location_id=m.ghl_location_id
      )
    order by s.subscribed_at nulls last,s.id
    limit p_limit
  loop
    resp := extensions.http((
      'POST'::extensions.http_method,
      'https://services.leadconnectorhq.com/contacts/upsert'::varchar,
      array[
        extensions.http_header('Authorization','Bearer '||r.pit_token),
        extensions.http_header('Version','2021-07-28'),
        extensions.http_header('Accept','application/json')
      ],
      'application/json'::varchar,
      jsonb_strip_nulls(jsonb_build_object(
        'locationId',r.ghl_location_id,
        'name',r.name,
        'email',lower(btrim(r.email)),
        'source','KHG explicit newsletter opt-in',
        'tags',jsonb_build_array(
          'newsletter_subscriber',
          'entity:'||r.brand_key,
          'consent:explicit',
          'segment:'||coalesce(r.segment,'general')
        ),
        'createNewIfDuplicateAllowed',false
      ))::text::varchar
    )::extensions.http_request);

    begin body_json:=resp.content::jsonb; exception when others then body_json:='{}'::jsonb; end;
    contact_id:=coalesce(body_json#>>'{contact,id}',body_json->>'id');

    if resp.status between 200 and 299 and coalesce(contact_id,'')<>'' then
      insert into public.ghl_outreach_contacts(
        ghl_contact_id,ghl_location_id,brand_context,first_name,last_name,email,
        relationship_type,assigned_persona,authority_level,outreach_channel,outreach_stage,
        confidence_score,next_action,do_not_contact,source,tags,notes,updated_at
      )
      values(
        contact_id,r.ghl_location_id,r.brand_key,
        nullif(split_part(coalesce(r.name,''),' ',1),''),
        nullif(regexp_replace(coalesce(r.name,''),'^\\S+\\s*',''),''),
        lower(btrim(r.email)),
        'newsletter_subscriber','newsletter','subscriber','email','consented',
        100,'Eligible for approved brand newsletter only.',false,
        coalesce(r.source,'newsletter_subscribers'),
        array['newsletter_subscriber','entity:'||r.brand_key,'consent:explicit'],
        'Mirrored from canonical newsletter_subscribers; subscription id='||r.subscriber_id::text,
        now()
      )
      on conflict (ghl_contact_id) do update set
        ghl_location_id=excluded.ghl_location_id,
        brand_context=excluded.brand_context,
        email=excluded.email,
        relationship_type='newsletter_subscriber',
        outreach_channel='email',
        outreach_stage='consented',
        confidence_score=100,
        next_action='Eligible for approved brand newsletter only.',
        do_not_contact=false,
        source=excluded.source,
        tags=excluded.tags,
        notes=excluded.notes,
        updated_at=now();
      v_synced:=v_synced+1;
    else
      update public.newsletter_subscribers
      set metadata=coalesce(metadata,'{}'::jsonb)||jsonb_build_object(
        'ghl_sync_status','error',
        'ghl_sync_http_status',resp.status,
        'ghl_sync_error',left(coalesce(body_json->>'message',body_json->>'error',resp.content),500),
        'ghl_sync_attempted_at',now()
      )
      where id=r.subscriber_id;
      v_errors:=v_errors+1;
    end if;
  end loop;

  return jsonb_build_object('ok',true,'synced',v_synced,'errors',v_errors,'at',now());
end;
$$;

revoke all on function public.sync_newsletter_subscribers_to_ghl_v1(integer)
from public, anon, authenticated;

-- pg_cron runtime:
-- select cron.schedule(
--   'khg-newsletter-subscriber-ghl-sync-v1',
--   '*/2 * * * *',
--   'select public.sync_newsletter_subscribers_to_ghl_v1(100);'
-- );
