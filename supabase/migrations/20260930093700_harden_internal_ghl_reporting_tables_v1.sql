alter table public.ghl_native_reporting_snapshots enable row level security;
alter table public.ghl_entity_record_links enable row level security;
alter table public.ghl_entity_data_import_queue enable row level security;

revoke all on table public.ghl_native_reporting_snapshots from anon, authenticated;
revoke all on table public.ghl_entity_record_links from anon, authenticated;
revoke all on table public.ghl_entity_data_import_queue from anon, authenticated;

alter view public.v_ghl_native_reporting_latest set (security_invoker = true);
alter view public.v_ghl_entity_execution_readiness_v3 set (security_invoker = true);

revoke all on table public.v_ghl_native_reporting_latest from anon, authenticated;
revoke all on table public.v_ghl_entity_execution_readiness_v3 from anon, authenticated;
