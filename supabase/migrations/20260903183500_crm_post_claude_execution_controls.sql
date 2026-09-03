-- Post-Claude execution controls.
-- 1) Queue rebuild accepts the strict scope-probe success state `authorized_validation_only`.
-- 2) Stage the four real enterprise ClickUp handoff actions without cluttering entity boards.

create or replace function public.crm_rebuild_ghl_pipeline_deployment_queue()
returns jsonb
language plpgsql
security definer
set search_path='public','pg_temp'
as $function$
declare
  v_total integer;
  v_blocked integer;
  v_queued integer;
  v_preserved integer;
begin
  update public.crm_ghl_pipeline_deployment_queue q
     set deployment_status='retired', updated_at=now()
   where not exists (
     select 1 from public.crm_entity_pipeline_manifest m
     where m.id=q.manifest_id and m.active is true
   )
   and q.deployment_status not in ('deployed','already_exists');

  insert into public.crm_ghl_pipeline_deployment_queue (
    manifest_id, enterprise_entity_id, entity_key, entity_name, department_key,
    pipeline_key, pipeline_name, deployment_wave, ghl_location_id, desired_payload,
    idempotency_key, scope_status, deployment_status, metadata, updated_at
  )
  select
    m.id,m.enterprise_entity_id,m.entity_key,m.entity_name,m.department_key,
    m.pipeline_key,m.pipeline_name,m.deployment_wave,r.ghl_location_id,
    jsonb_build_object(
      'name',m.pipeline_name,
      'stages',(select coalesce(jsonb_agg(jsonb_build_object('name',e.value->>'stage','position',coalesce(nullif(e.value->>'position','')::integer,e.ordinality::integer),'showInFunnel',true) order by coalesce(nullif(e.value->>'position','')::integer,e.ordinality::integer)),'[]'::jsonb) from jsonb_array_elements(m.stage_spec) with ordinality as e(value,ordinality)),
      'showInFunnel',false,'showInPieChart',true,'useOpportunityProbability',false,
      'locationId',r.ghl_location_id,'colorRenderMode','dot'
    ),
    md5(r.ghl_location_id || '|' || lower(m.pipeline_name)),
    r.pipeline_create_scope_status,
    case when r.pipeline_create_scope_status in ('authorized','authorized_validation_only') then 'queued' else 'blocked_scope' end,
    jsonb_build_object('manifest_source','crm_entity_pipeline_manifest','credential_strategy','per_location_pit','strict_entity_isolation',true,'owner_role',m.owner_role,'pm_role',m.pm_role),
    now()
  from public.crm_entity_pipeline_manifest m
  join public.crm_ghl_entity_runtime_map r on r.entity_key=m.entity_key and r.is_active=true
  where m.active is true
  on conflict (manifest_id) do update set
    enterprise_entity_id=excluded.enterprise_entity_id,
    entity_key=excluded.entity_key,
    entity_name=excluded.entity_name,
    department_key=excluded.department_key,
    pipeline_key=excluded.pipeline_key,
    pipeline_name=excluded.pipeline_name,
    deployment_wave=excluded.deployment_wave,
    ghl_location_id=excluded.ghl_location_id,
    desired_payload=excluded.desired_payload,
    idempotency_key=excluded.idempotency_key,
    scope_status=excluded.scope_status,
    deployment_status=case
      when public.crm_ghl_pipeline_deployment_queue.deployment_status in ('deployed','already_exists') then public.crm_ghl_pipeline_deployment_queue.deployment_status
      when excluded.scope_status in ('authorized','authorized_validation_only') then 'queued'
      else 'blocked_scope'
    end,
    metadata=public.crm_ghl_pipeline_deployment_queue.metadata || excluded.metadata,
    updated_at=now();

  select count(*) into v_total from public.crm_ghl_pipeline_deployment_queue q join public.crm_entity_pipeline_manifest m on m.id=q.manifest_id and m.active is true;
  select count(*) into v_blocked from public.crm_ghl_pipeline_deployment_queue q join public.crm_entity_pipeline_manifest m on m.id=q.manifest_id and m.active is true where q.deployment_status='blocked_scope';
  select count(*) into v_queued from public.crm_ghl_pipeline_deployment_queue q join public.crm_entity_pipeline_manifest m on m.id=q.manifest_id and m.active is true where q.deployment_status='queued';
  select count(*) into v_preserved from public.crm_ghl_pipeline_deployment_queue q join public.crm_entity_pipeline_manifest m on m.id=q.manifest_id and m.active is true where q.deployment_status in ('deployed','already_exists');

  return jsonb_build_object('ok',true,'active_pipeline_rows',v_total,'blocked_scope',v_blocked,'queued',v_queued,'preserved_deployed',v_preserved);
end;
$function$;

revoke all on function public.crm_rebuild_ghl_pipeline_deployment_queue() from public,anon,authenticated;
grant execute on function public.crm_rebuild_ghl_pipeline_deployment_queue() to service_role;

create table if not exists public.crm_clickup_execution_handoff_queue (
  id uuid primary key default gen_random_uuid(),
  task_key text not null unique,
  task_name text not null,
  owner_system text not null,
  clickup_workspace_id text not null,
  clickup_space_id text not null,
  target_list_name text not null,
  priority text not null default 'high',
  execution_status text not null default 'connector_write_blocked',
  description text,
  github_issue_number integer,
  metadata jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

alter table public.crm_clickup_execution_handoff_queue enable row level security;
revoke all on public.crm_clickup_execution_handoff_queue from anon, authenticated;
grant select,insert,update,delete on public.crm_clickup_execution_handoff_queue to service_role;

insert into public.crm_clickup_execution_handoff_queue(task_key,task_name,owner_system,clickup_workspace_id,clickup_space_id,target_list_name,priority,description,github_issue_number,metadata) values
('claude_ghl_permissions_senders','CLAUDE | GHL permissions + 12 sender identities','Claude','90141551653','90147280109','ENTERPRISE SYSTEMS — CRM / GHL / MESSAGING OS','urgent','Complete Issue #9 only: PIT permission edits and sender/mailbox/DNS readiness. Do not touch CRM deployment objects.',9,jsonb_build_object('central_workspace_verified',true)),
('chatgpt_native_deployment','CHATGPT | Deploy 599 pipelines + remaining 95 native agents','ChatGPT','90141551653','90147280109','ENTERPRISE SYSTEMS — CRM / GHL / MESSAGING OS','urgent','After Claude permissions are verified, release guarded native deployment queue and mirror agents OFF.',10,jsonb_build_object('pipeline_count',599,'agent_count',95)),
('chatgpt_burnin','CHATGPT | Controlled Wave 1 production burn-in','ChatGPT','90141551653','90147280109','ENTERPRISE SYSTEMS — CRM / GHL / MESSAGING OS','high','Run the 11 low-risk pilot programs only after infrastructure, sender and audience gates pass.',10,jsonb_build_object('pilot_programs',11,'autonomous_activation',false)),
('chatgpt_execution_binding','CHATGPT | CRM → ClickUp + website/app end-to-end execution binding','ChatGPT','90141551653','90147280109','ENTERPRISE SYSTEMS — CRM / GHL / MESSAGING OS','high','Verify source → Supabase → GHL → pipeline → owner/PM → messaging → ClickUp execution; flush into ClickUp when connector writes unlock.',10,jsonb_build_object('central_workspace_verified',true))
on conflict (task_key) do update set task_name=excluded.task_name,owner_system=excluded.owner_system,clickup_workspace_id=excluded.clickup_workspace_id,clickup_space_id=excluded.clickup_space_id,target_list_name=excluded.target_list_name,priority=excluded.priority,description=excluded.description,github_issue_number=excluded.github_issue_number,metadata=excluded.metadata,updated_at=now();
