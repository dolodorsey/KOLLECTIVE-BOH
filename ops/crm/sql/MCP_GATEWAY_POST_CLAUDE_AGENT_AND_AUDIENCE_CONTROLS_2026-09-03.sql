-- APPLIED LIVE TO MCP Gateway project dzlmtvodpyhetvektfuo on 2026-09-03.
-- Audit/source record; do not blindly apply to KOLLECTIVE BOH.

-- Native Conversation AI post-scope orchestrator:
-- public.crm_mirror_scope_blocked_agents_batch(text[],boolean)
-- Dry-run verified result before Claude handoff completion:
-- brand_count=14, agent_count=95, target_mode=off, network_calls=0.
-- Live mode delegates each entity to the existing exact-PIT crm_mirror_ghl_brand_agents function.

-- Production audience receipt table:
-- public.crm_program_audience_receipts
-- Records brand/program source, total rows, eligible rows, suppressed rows,
-- consent basis, proof metadata and timestamp.

-- Audience receipt gate:
-- public.crm_record_program_audience_receipt(...)
-- An eligible count > 0 is required to clear audience_gate.
-- A domain, mailbox, pipeline or agent permission alone never clears the audience gate.

-- Pilot readiness evaluator:
-- public.crm_refresh_pilot_readiness()
-- First-pilot program is allowed to reach `pilot_ready_for_controlled_launch` only when:
--   risk_tier = low
--   pipeline_ready = true
--   native_agent_ready = true
--   sender_ready = true
--   source_binding_ready = true
--   audience_gate = false
--   audience_eligible_count > 0
-- It does NOT activate sending or change agent/route modes.

-- Current 11 first-pilot candidates remain blocked because native pipelines are not ready
-- and the audited local production source tables currently contain zero real audience rows.
