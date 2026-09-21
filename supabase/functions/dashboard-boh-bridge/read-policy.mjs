// Internal dashboard reads only; these additions grant no mutation capability.
const READ_ONLY = new Set([
  "v_enterprise_daily_ops_command",
  "enterprise_incidents",
  "founder_reporting_policy",
  "v_ghl_entity_execution_truth_v2",
  "v_ghl_master_audit_matrix",
  "enterprise_entity_daily_ops",
  "agents",
  "agent_run_log",
  "v_bri_casper_location_queue",
  "casper_vendor_onboarding",
  "v_vc_founder_gmail_queue",
  "v_outreach_next_actions",
]);
export const isReadOnlyTable = (table) => READ_ONLY.has(table);
