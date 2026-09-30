revoke execute on function public.retire_superseded_engagement_jobs_v1() from public;
revoke execute on function public.retire_superseded_engagement_jobs_v1() from anon;
revoke execute on function public.retire_superseded_engagement_jobs_v1() from authenticated;
grant execute on function public.retire_superseded_engagement_jobs_v1() to service_role;
