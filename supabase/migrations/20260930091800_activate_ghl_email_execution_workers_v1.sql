select cron.unschedule(jobid) from cron.job
where jobname in ('ghl-email-dispatch-ready-v1','ghl-email-reconcile-v1','ghl-email-probe-v1');

select cron.schedule(
  'ghl-email-dispatch-ready-v1',
  '*/5 * * * *',
  $$select public.invoke_ghl_email_campaign_runtime_v1('dispatch_ready','{}'::jsonb);$$
);

select cron.schedule(
  'ghl-email-reconcile-v1',
  '2-59/5 * * * *',
  $$select public.invoke_ghl_email_campaign_runtime_v1('reconcile_all','{}'::jsonb);$$
);

select cron.schedule(
  'ghl-email-probe-v1',
  '23 */6 * * *',
  $$select public.invoke_ghl_email_campaign_runtime_v1('probe_all','{}'::jsonb);$$
);
