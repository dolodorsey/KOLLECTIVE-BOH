-- MEMORY MACHINE • SAFE INBOUND ROUTING QA (always rollback)
-- Run against KOLLECTIVE BOH in a controlled environment with migration applied.
-- No test records remain in production after execution. Never call a send provider.
BEGIN;
INSERT INTO public.memory_machine_site_leads
(email,name,organization,city,state,form_type,consent)
VALUES
('memory-machine.test.venue1@example.invalid','QA Venue 1','MM TEST QA BIZ 20261019','Atlanta','GA','venue_application',true),
('memory-machine.test.venue2@example.invalid','QA Venue 2','MM TEST QA BIZ 20261019','Atlanta','GA','venue_application',true),
('memory-machine.test.sponsor@example.invalid','QA Sponsor','MM TEST QA BIZ 20261019','Atlanta','GA','sponsor_inquiry',true),
('memory-machine.test.guest@example.invalid','QA Guest','MM TEST QA BIZ 20261019','Atlanta','GA','memory_retrieval',true);
DO $$
DECLARE
  venue_count integer; sponsor_count integer; blocked_ghl_count integer; unsafe_ghl_count integer;
BEGIN
  SELECT count(*) INTO venue_count FROM public.outreach_accounts
  WHERE entity_key='memory-machine' AND lane='memory_machine_venue'
    AND account_name='MM TEST QA BIZ 20261019' AND NOT active;
  SELECT count(*) INTO sponsor_count FROM public.outreach_accounts
  WHERE entity_key='memory-machine' AND lane='memory_machine_sponsor'
    AND account_name='MM TEST QA BIZ 20261019' AND NOT active;
  SELECT count(*) INTO blocked_ghl_count FROM public.ghl_entity_data_import_queue
  WHERE entity_key='memory-machine' AND source_table='memory_machine_site_leads'
    AND source_id IN (SELECT id FROM public.memory_machine_site_leads
                      WHERE email LIKE 'memory-machine.test.%@example.invalid')
    AND status='blocked_scope';
  SELECT count(*) INTO unsafe_ghl_count FROM public.ghl_entity_data_import_queue
  WHERE entity_key='memory-machine' AND source_table='memory_machine_site_leads'
    AND source_id IN (SELECT id FROM public.memory_machine_site_leads
                      WHERE email LIKE 'memory-machine.test.%@example.invalid')
    AND status='queued';
  IF venue_count<>1 OR sponsor_count<>1 OR blocked_ghl_count<>3 OR unsafe_ghl_count<>0 THEN
    RAISE EXCEPTION 'QA FAILED venue=% sponsor=% blocked=% queued=%',
      venue_count,sponsor_count,blocked_ghl_count,unsafe_ghl_count;
  END IF;
END;
$$;
ROLLBACK;
-- Re-read after rollback to confirm no synthetic residue:
SELECT (SELECT count(*) FROM public.memory_machine_site_leads
        WHERE email LIKE 'memory-machine.test.%@example.invalid') AS synthetic_leads_remaining,
       (SELECT count(*) FROM public.outreach_accounts
        WHERE account_name='MM TEST QA BIZ 20261019') AS synthetic_accounts_remaining;
