-- Snapshot of the MCP Gateway project (dzlmtvodpyhetvektfuo) live dispatch safeguards.
-- Deployed separately in Supabase; this file is for review, not automatic migration.
CREATE OR REPLACE FUNCTION public.khg_dispatch_due_social_publish_jobs(p_max integer DEFAULT 10)
 RETURNS jsonb
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public', 'extensions', 'net', 'pg_temp'
AS $function$
declare
  v_job record;
  v_request_id bigint;
  v_dispatched integer:=0;
  v_failed integer:=0;
  v_results jsonb:='[]'::jsonb;
begin
  for v_job in
    select id from public.social_publish_jobs
    where status='scheduled' and content_status='approved' and publish_status='scheduled'
      and scheduled_for is not null and scheduled_for<=now()
      and approved_at is not null and length(trim(coalesce(approval_note,'')))>=8
      and (coalesce(idempotency_key,'') not like 'boh:%'
       or (provider_response->>'media_binding_verified')='true')
    order by scheduled_for asc limit greatest(1,least(coalesce(p_max,10),50))
    for update skip locked
  loop
    begin
      v_request_id:=public.khg_dispatch_social_publish(v_job.id);
      v_dispatched:=v_dispatched+1;
      v_results:=v_results||jsonb_build_object('job_id',v_job.id,'request_id',v_request_id,'status','dispatched');
    exception when others then
      v_failed:=v_failed+1;
      update public.social_publish_jobs set status='failed',publish_status='failed',error=sqlerrm,updated_at=now() where id=v_job.id;
      v_results:=v_results||jsonb_build_object('job_id',v_job.id,'status','failed','error',sqlerrm);
    end;
  end loop;
  return jsonb_build_object('execution_path','direct_meta_api','dispatched',v_dispatched,'failed',v_failed,'results',v_results,'ran_at',now());
end;
$function$
;

CREATE OR REPLACE FUNCTION public.khg_dispatch_social_publish(p_job_id uuid)
 RETURNS bigint
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public', 'extensions', 'net', 'pg_temp'
AS $function$
declare
  v_job public.social_publish_jobs%rowtype;
  v_raw_token text;
  v_request_id bigint;
  v_idx integer;
begin
  select * into v_job from public.social_publish_jobs where id=p_job_id for update;
  if v_job.id is null then raise exception 'publish_job_not_found'; end if;
  if coalesce(v_job.idempotency_key,'') like 'boh:%' then
    if v_job.provider_response->>'media_binding_verified' IS DISTINCT FROM 'true'
      or nullif(v_job.provider_response->>'boh_approved_handle','') is null
      or jsonb_typeof(v_job.provider_response->'media_staging') is distinct from 'array'
      or jsonb_typeof(v_job.provider_response->'boh_verified_manifest') is distinct from 'array'
      or jsonb_array_length(v_job.provider_response->'media_staging') = 0
      or jsonb_array_length(v_job.provider_response->'media_staging') is distinct from cardinality(v_job.media_urls)
      or jsonb_array_length(v_job.provider_response->'media_staging') is distinct from jsonb_array_length(v_job.provider_response->'boh_verified_manifest') then
      raise exception 'boh_media_binding_missing_or_stale';
    end if;
    for v_idx in 0..jsonb_array_length(v_job.provider_response->'media_staging')-1 loop
      if v_job.provider_response->'media_staging'->v_idx->>'file_id'
           is distinct from v_job.provider_response->'boh_verified_manifest'->v_idx->>'file_id'
       or v_job.provider_response->'media_staging'->v_idx->>'sha256'
           is distinct from v_job.provider_response->'boh_verified_manifest'->v_idx->>'sha256'
       or v_job.media_urls[v_idx+1] is distinct from v_job.provider_response->'media_staging'->v_idx->>'url'
       or length(coalesce(v_job.provider_response->'media_staging'->v_idx->>'sha256',''))<>64 then
        raise exception 'boh_media_binding_digest_or_url_mismatch';
      end if;
    end loop;
  end if;
  if v_job.provider_publish_id is not null or v_job.status='published' then raise exception 'publish_job_already_completed'; end if;
  if v_job.content_status<>'approved' or v_job.publish_status not in ('approved','retry','verified','scheduled') or v_job.approved_at is null or length(trim(coalesce(v_job.approval_note,'')))<8 then
    raise exception 'publish_job_not_approved';
  end if;
  if v_job.scheduled_for is not null and v_job.scheduled_for>now()+interval '5 minutes' then raise exception 'publish_job_not_due'; end if;

  v_raw_token:=encode(gen_random_bytes(32),'hex');
  update public.social_publish_jobs
  set dispatch_token_hash=encode(digest(v_raw_token,'sha256'),'hex'),dispatch_token_expires_at=now()+interval '10 minutes',
      status='queued',publish_status='queued',last_attempt_at=now(),error=null,updated_at=now()
  where id=p_job_id;

  select net.http_post(
    url:='https://dzlmtvodpyhetvektfuo.supabase.co/functions/v1/social-publish-executor',
    body:=jsonb_build_object('job_id',p_job_id,'dispatch_token',v_raw_token),
    headers:=jsonb_build_object('Content-Type','application/json'),timeout_milliseconds:=10000
  ) into v_request_id;

  update public.social_publish_jobs set dispatch_request_id=v_request_id,updated_at=now() where id=p_job_id;
  return v_request_id;
end;
$function$
;

