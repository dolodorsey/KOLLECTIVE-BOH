create table if not exists public.crm_claude_admin_handoff_receipts (
  entity_key text primary key,
  reported_location_id text,
  reported_pipeline_scope text,
  reported_conversation_ai_scope text,
  reported_sender_domain text,
  reported_mailbox_status text,
  reported_spf_dkim_status text,
  reported_dmarc_status text,
  reported_production_sender text,
  reported_blocker text,
  raw_receipt jsonb not null default '{}'::jsonb,
  verification_status text not null default 'pending_independent_reprobe',
  received_at timestamptz not null default now(),
  verified_at timestamptz,
  updated_at timestamptz not null default now()
);
alter table public.crm_claude_admin_handoff_receipts enable row level security;
revoke all on public.crm_claude_admin_handoff_receipts from anon,authenticated;
grant select,insert,update,delete on public.crm_claude_admin_handoff_receipts to service_role;

create or replace function public.crm_ingest_claude_admin_handoff_receipt(p_receipts jsonb)
returns jsonb
language plpgsql
security definer
set search_path='public','pg_temp'
as $function$
declare r jsonb; v_count integer:=0;
begin
  if jsonb_typeof(p_receipts)<>'array' then raise exception 'p_receipts must be an array'; end if;
  for r in select value from jsonb_array_elements(p_receipts) loop
    if coalesce(r->>'entity_key','')='' then raise exception 'entity_key required in every receipt row'; end if;
    insert into public.crm_claude_admin_handoff_receipts(
      entity_key,reported_location_id,reported_pipeline_scope,reported_conversation_ai_scope,
      reported_sender_domain,reported_mailbox_status,reported_spf_dkim_status,reported_dmarc_status,
      reported_production_sender,reported_blocker,raw_receipt,verification_status,received_at,updated_at
    ) values (
      r->>'entity_key',r->>'location_id',r->>'pipelines_create',r->>'conversation_ai_manage',
      r->>'sender_domain',r->>'mailbox',r->>'spf_dkim',r->>'dmarc',r->>'production_sender',r->>'blocker',
      r,'pending_independent_reprobe',now(),now()
    ) on conflict(entity_key) do update set
      reported_location_id=excluded.reported_location_id,
      reported_pipeline_scope=excluded.reported_pipeline_scope,
      reported_conversation_ai_scope=excluded.reported_conversation_ai_scope,
      reported_sender_domain=excluded.reported_sender_domain,
      reported_mailbox_status=excluded.reported_mailbox_status,
      reported_spf_dkim_status=excluded.reported_spf_dkim_status,
      reported_dmarc_status=excluded.reported_dmarc_status,
      reported_production_sender=excluded.reported_production_sender,
      reported_blocker=excluded.reported_blocker,
      raw_receipt=excluded.raw_receipt,
      verification_status='pending_independent_reprobe',
      received_at=now(),verified_at=null,updated_at=now();
    v_count:=v_count+1;
  end loop;
  return jsonb_build_object('ok',true,'received',v_count,'release_side_effects',0,'verification_status','pending_independent_reprobe');
end;
$function$;

create or replace view public.v_crm_claude_handoff_verification_queue as
select r.entity_key,r.reported_location_id,r.reported_pipeline_scope,r.reported_conversation_ai_scope,
       r.reported_sender_domain,r.reported_mailbox_status,r.reported_spf_dkim_status,r.reported_dmarc_status,
       r.reported_production_sender,r.reported_blocker,r.verification_status,r.received_at,
       m.ghl_location_id as canonical_location_id,m.pipeline_create_scope_status as canonical_pipeline_scope,
       m.conversation_ai_scope_status as canonical_conversation_ai_scope,
       (r.reported_location_id is null or r.reported_location_id=m.ghl_location_id) as location_matches
from public.crm_claude_admin_handoff_receipts r
left join public.crm_ghl_entity_runtime_map m on m.entity_key=r.entity_key and m.is_active=true;

revoke all on function public.crm_ingest_claude_admin_handoff_receipt(jsonb) from public,anon,authenticated;
grant execute on function public.crm_ingest_claude_admin_handoff_receipt(jsonb) to service_role;
