-- MEMORY MACHINE / KOLLECTIVE BOH
-- Canonical re-creatable SQL for the production-verified 2026-10-19 inbound conversion gate.
-- Source database already migrated. This file is idempotent; it never sends communication,
-- schedules marketing, activates a prospect, or bypasses founder approval.

INSERT INTO public.outreach_lane_policies
  (lane,entity_key,channel_policy,contact_rotation,max_touches_per_contact,
   followup_delay_hours,switch_after_hours,success_criterion,stop_conditions,
   owner_role,closer_role,active,metadata)
VALUES
  ('memory_machine_sponsor','memory-machine',
   '{"mode":"internal_research_qa_only","channels":["gmail","phone","linkedin"],"sender_rule":"Memory Machine-specific sender and founder approval required; never borrow a different company sender","mass_message":false,"external_dispatch":false}'::jsonb,
   '[]'::jsonb,3,72,168,
   'Signed sponsor agreement, verified contract and payment receipt',
   '["opt-out","explicit no","unverified contact route","brand category conflict","sponsor rights unverified","founder hold"]'::jsonb,
   'Dot Research / Muse Internal QA','Dr. Dorsey',false,
   '{"research_quota":30,"outreach_authorized":false,"brand":"MEMORY MACHINE"}'::jsonb),
  ('memory_machine_event_buyer','memory-machine',
   '{"mode":"internal_research_qa_only","channels":["gmail","phone","linkedin"],"sender_rule":"Memory Machine-specific sender and founder approval required; never borrow a different company sender","mass_message":false,"external_dispatch":false}'::jsonb,
   '[]'::jsonb,3,72,168,
   'Signed event activation or booking, verified receipt',
   '["opt-out","explicit no","unverified contact route","event fit unverified","no brand/photo rights","founder hold"]'::jsonb,
   'Dot Research / Muse Internal QA','Dr. Dorsey',false,
   '{"research_quota":20,"outreach_authorized":false,"brand":"MEMORY MACHINE"}'::jsonb)
ON CONFLICT(lane) DO NOTHING;

CREATE OR REPLACE FUNCTION private.memory_machine_venue_intake_research_router()
 RETURNS trigger
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'pg_catalog', 'public', 'pg_temp'
AS $function$
DECLARE
  v_org text;
  v_lane text;
  v_account_type text;
  v_action text;
BEGIN
  IF NEW.form_type NOT IN ('venue_application','sponsor_inquiry')
     OR NEW.consent IS DISTINCT FROM TRUE
     OR NEW.email IS NULL OR position('@' IN NEW.email) < 2
  THEN RETURN NEW; END IF;

  v_org := left(btrim(coalesce(NEW.organization,'')),180);
  IF length(v_org) < 2 THEN RETURN NEW; END IF;

  v_lane := CASE NEW.form_type WHEN 'venue_application' THEN 'memory_machine_venue' ELSE 'memory_machine_sponsor' END;
  v_account_type := CASE NEW.form_type WHEN 'venue_application' THEN 'first_party_venue_application' ELSE 'first_party_sponsor_inquiry' END;
  v_action := CASE NEW.form_type
    WHEN 'venue_application' THEN 'Verify operating venue, owner or GM approval, floor space, electricity, exclusivity, sponsor rights, DNC and founder approval'
    ELSE 'Verify sponsoring organization, sponsor budget, category exclusivity, campaign rights, decision authority and founder approval'
  END;

  -- Business+lane-based lock prevents concurrent duplicate creation without merging sponsor and venue opportunities.
  PERFORM pg_catalog.pg_advisory_xact_lock(
    pg_catalog.hashtext('memory-machine:' || v_lane || ':' || lower(regexp_replace(v_org,'[^a-zA-Z0-9]','','g')))
  );

  INSERT INTO public.outreach_accounts (
    entity_key,lane,account_name,account_type,website,city,state,
    source_type,source_external_id,source_url,status,active,priority_tier,
    owner_role,next_action,source_payload,metadata
  )
  SELECT
    'memory-machine',v_lane,v_org,v_account_type,
    nullif(left(btrim(coalesce(NEW.website,'')),500),''),
    nullif(left(btrim(coalesce(NEW.city,'')),120),''),
    nullif(left(btrim(coalesce(NEW.state,'')),80),''),
    'memory_machine_site_leads',
    'memory_machine_site_lead:' || NEW.id::text,
    nullif(left(btrim(coalesce(NEW.source_page,'')),500),''),
    'research',false,'inbound_review','Muse Internal QA',
    v_action || ' — external outreach remains on founder hold',
    pg_catalog.jsonb_build_object('intake_id', NEW.id, 'form_type', NEW.form_type,'source_table','memory_machine_site_leads'),
    pg_catalog.jsonb_build_object(
      'source','first_party_inbound','research_only',true,'founder_hold',true,
      'outreach_authorized',false,'sender_verified',false,
      'consent_scope','respond_to_this_inquiry_only','intake_id',NEW.id
    )
  WHERE NOT EXISTS (
    SELECT 1 FROM public.outreach_accounts a
    WHERE a.entity_key='memory-machine' AND a.lane=v_lane
      AND (
        a.source_external_id='memory_machine_site_lead:' || NEW.id::text
        OR (
          lower(regexp_replace(a.account_name,'[^a-zA-Z0-9]','','g'))=lower(regexp_replace(v_org,'[^a-zA-Z0-9]','','g'))
          AND (lower(btrim(coalesce(a.state,'')))=lower(btrim(coalesce(NEW.state,''))) OR a.state IS NULL)
        )
      )
  );

  -- Queue is an internal blocked reconciliation reference, not a permission to import/send.
  -- Source PII remains in protected intake table, not repeated in the job payload.
  INSERT INTO public.ghl_entity_data_import_queue(
    entity_key,source_table,source_id,object_type,priority,status,blocker,payload,metadata
  )
  VALUES (
    'memory-machine','memory_machine_site_leads',NEW.id,'contact',50,'blocked_scope',
    'FOUNDER HOLD: exact Memory Machine GHL location, sender, consent scope, DNC and import authorization need verification',
    pg_catalog.jsonb_build_object('source_intake_id',NEW.id,'form_type',NEW.form_type),
    pg_catalog.jsonb_build_object('source','first_party_inbound','outbound_allowed',false,'founder_hold',true,'consent_scope','respond_to_this_inquiry_only')
  )
  ON CONFLICT(entity_key,source_table,source_id,object_type) DO NOTHING;
  RETURN NEW;
END;
$function$


REVOKE ALL ON FUNCTION private.memory_machine_venue_intake_research_router()
  FROM PUBLIC, anon, authenticated;

DROP TRIGGER IF EXISTS memory_machine_venue_intake_to_research
  ON public.memory_machine_site_leads;
CREATE TRIGGER memory_machine_venue_intake_to_research
  AFTER INSERT ON public.memory_machine_site_leads
  FOR EACH ROW
  EXECUTE FUNCTION private.memory_machine_venue_intake_research_router();

-- Research and import-review only: GHL jobs use status blocked_scope, never queued.
-- Imported commercial research remains inactive until exact founder authorization and QA.
