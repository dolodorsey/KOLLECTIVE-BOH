CREATE OR REPLACE FUNCTION public.invoke_social_media_stage_drive_v1(p_payload jsonb)
 RETURNS bigint
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO ''
AS $function$
declare
  v_nonce uuid:=pg_catalog.gen_random_uuid();
  v_request_id bigint;
  v_body jsonb;
begin
  insert into public.runtime_bootstrap_nonces(nonce,purpose,expires_at)
  values(v_nonce,'social_media_stage_drive_v1',now()+interval '5 minutes');

  v_body:=coalesce(p_payload,'{}'::jsonb)||jsonb_build_object('nonce',v_nonce);

  select net.http_post(
    url:='https://wfkohcwxxsrhcxhepfql.supabase.co/functions/v1/social-media-stage-drive-v1',
    headers:=jsonb_build_object('Content-Type','application/json'),
    body:=v_body,
    timeout_milliseconds:=120000
  ) into v_request_id;

  return v_request_id;
end;
$function$
;
