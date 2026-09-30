select cron.unschedule(jobid) from cron.job
where jobname='daily-marketing-email-program-v1';

select cron.schedule(
  'daily-marketing-email-program-v1',
  '12 * * * *',
  $$select private.refresh_daily_marketing_email_program_v1();$$
);
