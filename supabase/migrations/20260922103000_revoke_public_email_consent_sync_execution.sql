-- Security hardening: the first-party consent sync is an internal scheduled job.
-- It must not be callable through the public PostgREST RPC surface.
-- Preserve service-side execution for internal workers/cron while removing browser-role access.

revoke execute on function public.sync_first_party_email_consent_v1() from public, anon, authenticated;
grant execute on function public.sync_first_party_email_consent_v1() to service_role;
