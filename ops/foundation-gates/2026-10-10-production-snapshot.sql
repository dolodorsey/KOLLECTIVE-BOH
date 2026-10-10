-- KHG Foundation Production Gate Snapshot — 2026-10-10.
-- Apply only after independent review. Functions already deployed in BOH.

CREATE OR REPLACE FUNCTION public.enforce_canonical_creative_source()
 RETURNS trigger
 LANGUAGE plpgsql
 SET search_path TO 'pg_catalog', 'public'
AS $function$
DECLARE law jsonb;packet jsonb;banned text;needs_gate boolean;qat timestamptz;score numeric;
BEGIN
 SELECT to_jsonb(l) INTO law FROM public.marketing_asset_source_laws l WHERE law_key='ig_primary_drive_asset_source_v1' AND status='active';
 IF law IS NULL THEN RAISE EXCEPTION 'CANONICAL_SOURCE_POLICY_UNAVAILABLE'; END IF;
 IF TG_OP='UPDATE' AND OLD.metadata->>'retired_by_founder'='true' THEN
  IF NEW.publish_status<>'archived' OR NEW.metadata->>'retired_by_founder' IS DISTINCT FROM 'true' THEN
   RAISE EXCEPTION 'FOUNDER_RETIRED_CONTENT_CANNOT_REACTIVATE';
  END IF;
 END IF;
 IF NEW.publish_status NOT IN ('archived','published') THEN
  FOR banned IN SELECT jsonb_array_elements_text(coalesce(law#>'{enforcement_rules,retired_asset_tokens}','[]'::jsonb)) LOOP
   IF position(banned IN coalesce(NEW.asset_refs::text,''))>0 THEN RAISE EXCEPTION 'RETIRED_ASSET_REPLACEMENT_REQUIRED'; END IF;
  END LOOP;
 END IF;
 needs_gate:=NEW.publish_status IN ('approved','scheduled','publishing','processing')
  OR (NEW.publish_status='published' AND (TG_OP='INSERT' OR OLD.publish_status IS DISTINCT FROM 'published'))
  OR NEW.metadata->>'launch_authorized'='true' OR NEW.metadata->>'package_approved'='true';
 IF needs_gate THEN
  packet:=law#>ARRAY['source_registry','verified_packages',NEW.id::text];
  BEGIN qat:=nullif(packet->>'qa_at','')::timestamptz;score:=nullif(packet->>'quality_score','')::numeric; EXCEPTION WHEN OTHERS THEN qat:=null;score:=null; END;
  IF packet IS NULL OR packet->>'caption' IS DISTINCT FROM NEW.caption_draft
   OR packet->'asset_refs' IS DISTINCT FROM NEW.asset_refs
   OR packet->>'enterprise_entity_id' IS DISTINCT FROM NEW.enterprise_entity_id::text
   OR packet->>'content_type' IS DISTINCT FROM NEW.content_type
   OR nullif(packet->>'reviewer','') IS NULL OR nullif(packet->>'author','') IS NULL
   OR packet->>'reviewer'=packet->>'author'
   OR packet->>'qa_result' IS DISTINCT FROM 'passed'
   OR qat IS NULL OR qat<timestamptz '2026-10-10T03:00:00Z' OR score IS NULL OR score<95 OR packet->>'critical_defects' IS DISTINCT FROM '0' OR packet->>'brand_fidelity_pass' IS DISTINCT FROM 'true' THEN
    RAISE EXCEPTION 'CANONICAL_INDEPENDENT_FRESH_EXACT_QA_REQUIRED';
  END IF;
 END IF;
 IF NEW.publish_status='published' AND (TG_OP='INSERT' OR OLD.publish_status IS DISTINCT FROM 'published') THEN
  IF NOT EXISTS(SELECT 1 FROM public.social_execution_receipts r WHERE r.content_operation_id=NEW.id
    AND r.provider_status='published' AND nullif(r.external_id,'') IS NOT NULL
    AND nullif(r.permalink,'') IS NOT NULL AND r.raw_receipt->>'provider_proof_received'='true') THEN
   RAISE EXCEPTION 'PUBLISH_PROVIDER_VERIFIED_RECEIPT_REQUIRED';
  END IF;
 END IF;
 RETURN NEW;
END;$function$
;

CREATE OR REPLACE FUNCTION public.enforce_founder_social_brand_laws()
 RETURNS trigger
 LANGUAGE plpgsql
 SET search_path TO 'pg_catalog', 'public'
AS $function$
DECLARE k text;local_time time;token text;
BEGIN
 IF NEW.platform IS DISTINCT FROM 'instagram' THEN RETURN NEW; END IF;
 IF NOT (NEW.publish_status IN ('approved','scheduled','publishing','processing')
 OR (NEW.publish_status='published' AND (TG_OP='INSERT' OR OLD.publish_status IS DISTINCT FROM 'published'))) THEN RETURN NEW; END IF;
 SELECT entity_key INTO k FROM public.enterprise_directory_records WHERE id=NEW.enterprise_entity_id;
 IF k IS DISTINCT FROM 'dr-dorsey' THEN RETURN NEW; END IF;
 IF coalesce(NEW.content_pillar,'') ~* 'mini[ -]?me' THEN
  RAISE EXCEPTION 'DORSEY_RETIRED_CHARACTER_CATEGORY_PROHIBITED';
 END IF;
 IF NEW.scheduled_at IS NOT NULL THEN
  local_time:=(NEW.scheduled_at AT TIME ZONE 'America/New_York')::time;
  IF local_time='09:30:00'::time AND (
    lower(coalesce(NEW.content_pillar,'')) NOT LIKE '%hakuna%'
    OR lower(coalesce(NEW.content_type,''))<>'carousel') THEN
    RAISE EXCEPTION 'DORSEY_0930_HAKUNA_EDITORIAL_CAROUSEL_ONLY';
  END IF;
  IF local_time='12:30:00'::time AND NOT(
    lower(coalesce(NEW.content_pillar,'')) LIKE '%bts%'
    OR lower(coalesce(NEW.content_pillar,'')) LIKE '%behind%scenes%') THEN
    RAISE EXCEPTION 'DORSEY_1230_REAL_BTS_ONLY';
  END IF;
 END IF;
 FOREACH token IN ARRAY ARRAY['#DrDorsey','@KOLLECTIVEHOSPITALITY','@THEICONICLIVE','@GOODTIMESWORLDWIDE','@THESOLEEXCHANGEWORLDWIDE'] LOOP
  IF position(token IN coalesce(NEW.caption_draft,''))=0 THEN
    RAISE EXCEPTION 'DORSEY_REQUIRED_FOOTER_MISSING:%',token;
  END IF;
 END LOOP;
 RETURN NEW;
END;$function$
;

CREATE OR REPLACE FUNCTION public.enforce_marketing_asset_tree()
 RETURNS trigger
 LANGUAGE plpgsql
 SET search_path TO 'pg_catalog', 'public'
AS $function$
DECLARE f record;stamp timestamptz;file_modified timestamptz;original_created timestamptz;epoch constant timestamptz:='2026-10-10T03:00:00Z';
BEGIN
 SELECT root_drive_folder_id,publish_enabled,rules INTO f FROM public.marketing_drive_folders WHERE drive_folder_id=NEW.drive_folder_id;
 NEW.metadata:=coalesce(NEW.metadata,'{}'::jsonb);
 IF f IS NULL OR f.root_drive_folder_id IS DISTINCT FROM '1OjxHeuwZnD6_vI4WOGz8i4BJ61BsR9Ya'
  OR f.publish_enabled IS DISTINCT FROM TRUE OR coalesce(f.rules->>'hold_reason','')<>'' THEN
  NEW.metadata:=NEW.metadata||jsonb_build_object('source_epoch_ok',false,'eligibility_hold','NOT_AUTHORIZED_MARKETING_FOLDER');
  RETURN NEW;
 END IF;
 IF NEW.metadata->>'source_epoch_ok'='true' THEN
  IF coalesce(NEW.metadata->>'drive_metadata_verified_by','')<>'google_drive_connector'
   OR nullif(NEW.metadata->>'drive_created_time_verified_utc','') IS NULL
   OR nullif(NEW.metadata->>'drive_modified_time_verified_utc','') IS NULL
   OR nullif(NEW.metadata->>'original_creative_produced_at_utc','') IS NULL
   OR nullif(NEW.metadata->>'fresh_creative_reviewed_by','') IS NULL
   OR nullif(NEW.metadata->>'drive_ancestry_verified_at','') IS NULL THEN
    NEW.metadata:=NEW.metadata||jsonb_build_object('source_epoch_ok',false,'eligibility_hold','NEEDS_VERIFIED_DRIVE_METADATA');
    RETURN NEW;
  END IF;
  BEGIN stamp:=(NEW.metadata->>'drive_created_time_verified_utc')::timestamptz; file_modified:=(NEW.metadata->>'drive_modified_time_verified_utc')::timestamptz;original_created:=(NEW.metadata->>'original_creative_produced_at_utc')::timestamptz;
  EXCEPTION WHEN OTHERS THEN
    NEW.metadata:=NEW.metadata||jsonb_build_object('source_epoch_ok',false,'eligibility_hold','INVALID_DRIVE_CREATION_TIMESTAMP');
    RETURN NEW;
  END;
  IF stamp<epoch OR file_modified<epoch OR original_created<epoch OR original_created>file_modified THEN
    NEW.metadata:=NEW.metadata||jsonb_build_object('source_epoch_ok',false,'eligibility_hold','PRE_CUTOFF_REFERENCE_ONLY');
  END IF;
 END IF;
 RETURN NEW;
END;$function$
;

CREATE OR REPLACE FUNCTION public.enforce_marketing_source_epoch()
 RETURNS trigger
 LANGUAGE plpgsql
 SET search_path TO 'pg_catalog', 'public'
AS $function$
DECLARE epoch timestamptz;ref jsonb;fid text;role text;a record;stamped timestamptz;file_modified timestamptz;original_created timestamptz;finals int:=0;n int:=0;
BEGIN
 SELECT (source_registry#>>'{source_epoch,epoch}')::timestamptz INTO epoch FROM public.marketing_asset_source_laws
 WHERE law_key='ig_primary_drive_asset_source_v1' AND status='active';
 IF epoch IS NULL THEN RAISE EXCEPTION 'SOURCE_GATE_CONFIGURATION_MISSING'; END IF;
 IF NOT (NEW.publish_status IN ('approved','scheduled','publishing','processing')
 OR (NEW.publish_status='published' AND (TG_OP='INSERT' OR OLD.publish_status IS DISTINCT FROM 'published'))) THEN RETURN NEW; END IF;
 IF NEW.created_at<epoch THEN RAISE EXCEPTION 'PRE_RESET_CONTENT_RETIRED'; END IF;
 IF NEW.asset_refs IS NULL OR jsonb_typeof(NEW.asset_refs)<>'array' OR jsonb_array_length(NEW.asset_refs)=0 THEN
  RAISE EXCEPTION 'SOURCE_GATE_ASSET_REFS_REQUIRED';
 END IF;
 FOR ref IN SELECT value FROM jsonb_array_elements(NEW.asset_refs) LOOP
  n:=n+1;role:=coalesce(nullif(ref->>'usage_role',''),'final');
  IF role NOT IN ('final','source_reference') THEN RAISE EXCEPTION 'SOURCE_GATE_INVALID_ASSET_ROLE'; END IF;
  fid:=coalesce(nullif(ref->>'file_id',''),nullif(ref->>'drive_file_id',''),substring(ref->>'url' FROM '/d/([A-Za-z0-9_-]{20,})'));
  IF fid IS NULL THEN RAISE EXCEPTION 'SOURCE_GATE_MISSING_EXACT_DRIVE_ID'; END IF;
  SELECT ma.metadata,ma.lifecycle_status,ma.drive_file_id,ma.entity_key,
   mf.root_drive_folder_id,mf.publish_enabled,mf.rules,mf.folder_name INTO a
  FROM public.marketing_drive_assets ma JOIN public.marketing_drive_folders mf
   ON mf.drive_folder_id=ma.drive_folder_id WHERE ma.drive_file_id=fid;
  IF NOT FOUND OR a.root_drive_folder_id IS DISTINCT FROM '1OjxHeuwZnD6_vI4WOGz8i4BJ61BsR9Ya'
   OR a.publish_enabled IS DISTINCT FROM TRUE OR coalesce(a.rules->>'hold_reason','')<>''
   OR a.lifecycle_status IN ('blocked','retired','hold') THEN
   RAISE EXCEPTION 'SOURCE_GATE_MISSING_OR_PROHIBITED_DRIVE_ASSET:%',fid;
  END IF;
  IF role='source_reference' THEN CONTINUE; END IF;
  finals:=finals+1;
  IF a.metadata->>'source_epoch_ok' IS DISTINCT FROM 'true'
   OR a.metadata->>'drive_metadata_verified_by' IS DISTINCT FROM 'google_drive_connector'
   OR nullif(a.metadata->>'drive_ancestry_verified_at','') IS NULL
   OR nullif(a.metadata->>'drive_created_time_verified_utc','') IS NULL
   OR nullif(a.metadata->>'drive_modified_time_verified_utc','') IS NULL
   OR nullif(a.metadata->>'original_creative_produced_at_utc','') IS NULL
   OR nullif(a.metadata->>'fresh_creative_reviewed_by','') IS NULL THEN
   RAISE EXCEPTION 'SOURCE_GATE_UNVERIFIED_FINAL_ASSET:%',fid;
  END IF;
  BEGIN stamped:=(a.metadata->>'drive_created_time_verified_utc')::timestamptz;file_modified:=(a.metadata->>'drive_modified_time_verified_utc')::timestamptz;original_created:=(a.metadata->>'original_creative_produced_at_utc')::timestamptz;
  EXCEPTION WHEN OTHERS THEN RAISE EXCEPTION 'SOURCE_GATE_INVALID_FINAL_TIMESTAMP:%',fid; END;
  IF stamped<epoch OR file_modified<epoch OR original_created<epoch OR original_created>file_modified THEN RAISE EXCEPTION 'SOURCE_GATE_PRE_CUTOFF_FINAL_ASSET:%',fid; END IF;
 END LOOP;
 IF n=0 OR finals=0 THEN RAISE EXCEPTION 'SOURCE_GATE_FRESH_FINAL_CREATIVE_REQUIRED'; END IF;
 RETURN NEW;
END;$function$
;

CREATE OR REPLACE FUNCTION public.khg_marketing_release_preflight(p_content_id uuid)
 RETURNS jsonb
 LANGUAGE plpgsql
 SET search_path TO 'pg_catalog', 'public'
AS $function$
DECLARE g public.growth_content_operations%rowtype;policy record;packet jsonb;ref jsonb;fid text;purpose text;item record;
       fresh integer:=0;epoch timestamptz:=timestamptz '2026-10-10T03:00:00Z';stamp timestamptz;file_modified timestamptz;original_created timestamptz;quality numeric;
       brand text;sourcebrand text;
BEGIN
 SELECT * INTO g FROM public.growth_content_operations WHERE id=p_content_id;
 IF NOT FOUND THEN RETURN jsonb_build_object('ok',false,'code','CONTENT_MISSING'); END IF;
 IF g.publish_status<>'scheduled' OR g.compliance_status<>'clear'
 OR g.scheduled_at IS NULL OR g.metadata->>'launch_authorized' IS DISTINCT FROM 'true'
 THEN RETURN jsonb_build_object('ok',false,'code','NOT_APPROVED_SCHEDULED'); END IF;
 IF g.created_at < epoch THEN RETURN jsonb_build_object('ok',false,'code','BEFORE_FOUNDATION_CUTOFF'); END IF;
 SELECT source_registry,enforcement_rules INTO policy FROM public.marketing_asset_source_laws
 WHERE law_key='ig_primary_drive_asset_source_v1' AND status='active';
 IF NOT FOUND THEN RETURN jsonb_build_object('ok',false,'code','POLICY_MISSING'); END IF;
 packet:=policy.source_registry#>ARRAY['verified_packages',g.id::text];
 IF packet IS NULL OR packet->>'caption' IS DISTINCT FROM g.caption_draft
 OR packet->'asset_refs' IS DISTINCT FROM g.asset_refs
 OR packet->>'enterprise_entity_id' IS DISTINCT FROM g.enterprise_entity_id::text
 OR packet->>'content_type' IS DISTINCT FROM g.content_type
 OR packet->>'qa_result' IS DISTINCT FROM 'passed'
 OR nullif(packet->>'reviewer','') IS NULL OR nullif(packet->>'author','') IS NULL
 OR packet->>'reviewer'=packet->>'author'
 OR packet->>'brand_fidelity_pass' IS DISTINCT FROM 'true'
 OR packet->>'critical_defects' IS DISTINCT FROM '0'
 THEN RETURN jsonb_build_object('ok',false,'code','EXACT_INDEPENDENT_QA_INCOMPLETE'); END IF;
 BEGIN
   IF (packet->>'qa_at')::timestamptz<epoch THEN RETURN jsonb_build_object('ok',false,'code','STALE_QA'); END IF;
   quality:=(packet->>'quality_score')::numeric;
 EXCEPTION WHEN OTHERS THEN RETURN jsonb_build_object('ok',false,'code','QA_EVIDENCE_INVALID'); END;
 IF quality IS NULL OR quality<95 OR (packet->>'qa_at') IS NULL
 THEN RETURN jsonb_build_object('ok',false,'code','GRAPHIC_QA_BELOW_95'); END IF;
 SELECT entity_key INTO brand FROM public.enterprise_directory_records WHERE id=g.enterprise_entity_id;
 IF brand IS NULL THEN RETURN jsonb_build_object('ok',false,'code','BRAND_UNKNOWN'); END IF;
 IF jsonb_typeof(g.asset_refs)<>'array' OR jsonb_array_length(g.asset_refs)=0
 THEN RETURN jsonb_build_object('ok',false,'code','ASSET_REFS_REQUIRED'); END IF;
 FOR ref IN SELECT value FROM jsonb_array_elements(g.asset_refs) LOOP
   fid:=coalesce(nullif(ref->>'file_id',''),nullif(ref->>'drive_file_id',''),
            substring(ref->>'url' FROM '/d/([A-Za-z0-9_-]{20,})'));
   purpose:=coalesce(nullif(ref->>'usage_role',''),'final');
   IF fid IS NULL OR purpose NOT IN('final','source_reference')
      THEN RETURN jsonb_build_object('ok',false,'code','BAD_ASSET_REFERENCE'); END IF;
   SELECT a.metadata,a.lifecycle_status,a.entity_key AS asset_brand,
      f.entity_key AS folder_brand,f.root_drive_folder_id,f.publish_enabled,f.rules
      INTO item FROM public.marketing_drive_assets a
      JOIN public.marketing_drive_folders f ON f.drive_folder_id=a.drive_folder_id
      WHERE a.drive_file_id=fid;
   IF NOT FOUND OR item.root_drive_folder_id IS DISTINCT FROM '1OjxHeuwZnD6_vI4WOGz8i4BJ61BsR9Ya'
      OR item.publish_enabled IS DISTINCT FROM TRUE OR coalesce(item.rules->>'hold_reason','')<>''
      OR item.lifecycle_status IN('blocked','retired','hold')
   THEN RETURN jsonb_build_object('ok',false,'code','ASSET_NOT_CANONICAL','file_id',fid); END IF;
   sourcebrand:=coalesce(item.asset_brand,item.folder_brand);
   IF nullif(ref->>'source_brand','') IS NULL
   OR (sourcebrand IS NOT NULL AND lower(ref->>'source_brand')<>lower(sourcebrand))
   THEN RETURN jsonb_build_object('ok',false,'code','SOURCE_BRAND_ATTRIBUTION_MISMATCH','file_id',fid); END IF;
   IF sourcebrand IS NOT NULL AND lower(sourcebrand)<>lower(brand)
      AND ref->>'cross_promotion_approved' IS DISTINCT FROM 'true'
   THEN RETURN jsonb_build_object('ok',false,'code','CROSS_BRAND_ASSET_NOT_APPROVED','file_id',fid); END IF;
   IF purpose='source_reference' THEN CONTINUE; END IF;
   fresh:=fresh+1;
   IF item.metadata->>'source_epoch_ok' IS DISTINCT FROM 'true'
     OR item.metadata->>'drive_metadata_verified_by' IS DISTINCT FROM 'google_drive_connector'
     OR nullif(item.metadata->>'drive_ancestry_verified_at','') IS NULL
     OR nullif(item.metadata->>'drive_created_time_verified_utc','') IS NULL
     OR nullif(item.metadata->>'drive_modified_time_verified_utc','') IS NULL
     OR nullif(item.metadata->>'original_creative_produced_at_utc','') IS NULL
     OR nullif(item.metadata->>'fresh_creative_reviewed_by','') IS NULL
   THEN RETURN jsonb_build_object('ok',false,'code','UNVERIFIED_FINAL','file_id',fid); END IF;
   BEGIN stamp:=(item.metadata->>'drive_created_time_verified_utc')::timestamptz;file_modified:=(item.metadata->>'drive_modified_time_verified_utc')::timestamptz;original_created:=(item.metadata->>'original_creative_produced_at_utc')::timestamptz;
   EXCEPTION WHEN OTHERS THEN RETURN jsonb_build_object('ok',false,'code','BAD_FINAL_CREATION_TIME','file_id',fid); END;
   IF stamp<epoch OR file_modified<epoch OR original_created<epoch OR original_created>file_modified THEN RETURN jsonb_build_object('ok',false,'code','OLD_FINAL_ASSET','file_id',fid); END IF;
 END LOOP;
 IF fresh=0 THEN RETURN jsonb_build_object('ok',false,'code','NO_FRESH_FINAL_CREATIVE'); END IF;
 RETURN jsonb_build_object('ok',true,'code','QA_APPROVED_RELEASE_CANDIDATE','content_id',p_content_id,'final_count',fresh);
END;$function$
;
CREATE OR REPLACE VIEW public.v_marketing_instagram_schedule AS  SELECT g.id,
    g.content_key,
    g.enterprise_entity_id,
    e.entity_key,
    e.entity_name,
    e.division,
    e.priority AS entity_priority,
    e.instagram AS ig_handle,
    e.graphics_folder_url,
    e.campaign_folder_url,
    g.platform,
    g.content_type,
    g.content_pillar,
    g.objective,
    g.hook,
    g.concept,
    g.caption_draft,
    g.cta,
    g.asset_refs,
    g.publish_status,
    g.scheduled_at,
    g.published_at,
    g.engagement_window_start,
    g.engagement_window_end,
    g.compliance_status,
    g.performance,
    g.repurpose_plan,
    g.metadata,
        CASE
            WHEN e.entity_key = 'dr-dorsey'::text AND COALESCE(g.content_pillar, ''::text) ~* 'mini[ -]?me'::text THEN 'founder_prohibited_content'::text
            WHEN g.publish_status = 'published'::text THEN 'published'::text
            WHEN COALESCE((g.metadata ->> 'launch_authorized'::text)::boolean, false) = false AND (g.publish_status = ANY (ARRAY['scheduled'::text, 'approved'::text])) THEN 'owner_approval_required'::text
            WHEN g.publish_status = 'scheduled'::text AND g.compliance_status = 'clear'::text AND g.scheduled_at IS NOT NULL THEN 'ready'::text
            WHEN g.publish_status = 'approved'::text AND g.compliance_status = 'clear'::text THEN 'approved'::text
            WHEN g.compliance_status = ANY (ARRAY['review_required'::text, 'restricted'::text, 'rejected'::text]) THEN 'compliance_attention'::text
            WHEN g.publish_status = ANY (ARRAY['review'::text, 'briefed'::text, 'in_production'::text, 'idea'::text]) THEN 'needs_review'::text
            ELSE COALESCE(g.publish_status, 'needs_review'::text)
        END AS review_state,
    g.publish_status = 'scheduled'::text AND g.compliance_status = 'clear'::text AND g.scheduled_at IS NOT NULL AND g.asset_refs IS NOT NULL AND g.asset_refs <> 'null'::jsonb AND COALESCE((g.metadata ->> 'launch_authorized'::text)::boolean, false) = true AND NOT (e.entity_key = 'dr-dorsey'::text AND COALESCE(g.content_pillar, ''::text) ~* 'mini[ -]?me'::text) AS ready_to_publish,
    (g.publish_status = ANY (ARRAY['review'::text, 'briefed'::text, 'in_production'::text, 'idea'::text])) OR COALESCE(g.compliance_status, 'pending'::text) <> 'clear'::text OR (g.publish_status = ANY (ARRAY['scheduled'::text, 'approved'::text])) AND COALESCE((g.metadata ->> 'launch_authorized'::text)::boolean, false) = false OR e.entity_key = 'dr-dorsey'::text AND COALESCE(g.content_pillar, ''::text) ~* 'mini[ -]?me'::text AS requires_owner_review,
    g.created_at,
    g.updated_at
   FROM growth_content_operations g
     JOIN enterprise_directory_records e ON e.id = g.enterprise_entity_id
  WHERE g.platform = 'instagram'::text AND g.publish_status <> 'archived'::text;;
