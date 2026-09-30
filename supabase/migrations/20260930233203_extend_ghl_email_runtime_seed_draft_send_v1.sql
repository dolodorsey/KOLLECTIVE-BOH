CREATE OR REPLACE FUNCTION public.invoke_ghl_email_campaign_runtime_v1(p_action text, p_payload jsonb DEFAULT '{}'::jsonb)
 RETURNS bigint
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO ''
AS $function$
declare
  v_nonce uuid := pg_catalog.gen_random_uuid();
  v_request_id bigint;
  v_body jsonb;
begin
  if p_action not in ('repair_fenyx','probe','probe_all','pipeline_probe','tag_lookup','audience_probe','seed_draft_send','manual_b2b_send','qa_send','dry_run','dispatch','dispatch_ready','reconcile','reconcile_all') then
    raise exception 'unsupported action';
  end if;

  insert into public.runtime_bootstrap_nonces(nonce,purpose,expires_at)
  values(v_nonce,'ghl_email_campaign_runtime_v1',now()+interval '5 minutes');

  v_body := coalesce(p_payload,'{}'::jsonb)
    || jsonb_build_object('action',p_action,'nonce',v_nonce);

  select net.http_post(
    url := 'https://wfkohcwxxsrhcxhepfql.supabase.co/functions/v1/ghl-email-campaign-runtime-v1',
    headers := jsonb_build_object('Content-Type','application/json'),
    body := v_body,
    timeout_milliseconds := 120000
  )
  into v_request_id;

  return v_request_id;
end;
$function$
;
