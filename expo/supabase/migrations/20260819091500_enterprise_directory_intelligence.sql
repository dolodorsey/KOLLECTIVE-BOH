-- KOLLECTIVE Enterprise intelligence layer.
-- Risk/freshness drives operator attention; alphabetical order is presentation-only.

create or replace view public.enterprise_directory_intelligence
with (security_invoker = true)
as
with execution_health as (
  select entity_id,
    count(*) filter (where queue_status='failed' and created_at>=now()-interval '24 hours')::integer as failed_runs_24h,
    count(*) filter (where queue_status in ('pending','queued','running'))::integer as open_runs,
    max(coalesce(completed_at,updated_at,created_at)) as last_execution_at
  from public.company_execution_queue
  group by entity_id
), base as (
  select e.*,
    coalesce(x.failed_runs_24h,0) as failed_runs_24h,
    coalesce(x.open_runs,0) as open_runs,
    x.last_execution_at,
    case
      when lower(coalesce(e.status,''))='active' and lower(coalesce(e.priority,'')) in ('critical','high','90') then interval '72 hours'
      when lower(coalesce(e.status,''))='active' then interval '7 days'
      when lower(coalesce(e.status,'')) in ('build','development','needs_verification') then interval '7 days'
      when lower(coalesce(e.status,''))='needs_contact_info' then interval '14 days'
      else interval '30 days'
    end as freshness_sla
  from public.enterprise_directory_records e
  left join execution_health x on x.entity_id=e.id
)
select b.*,
  greatest(b.updated_at,coalesce(b.last_verified_at,'epoch'::timestamptz),coalesce(b.last_execution_at,'epoch'::timestamptz)) as last_activity_at,
  case
    when greatest(b.updated_at,coalesce(b.last_verified_at,'epoch'::timestamptz),coalesce(b.last_execution_at,'epoch'::timestamptz)) < now()-b.freshness_sla then 'stale'
    when greatest(b.updated_at,coalesce(b.last_verified_at,'epoch'::timestamptz),coalesce(b.last_execution_at,'epoch'::timestamptz)) < now()-(b.freshness_sla*0.70) then 'aging'
    else 'fresh'
  end as freshness_status,
  least(100,
    (case when nullif(b.current_blocker,'') is not null then 35 else 0 end)
    + (case when b.failed_runs_24h>0 then least(25,b.failed_runs_24h*8) else 0 end)
    + (case lower(coalesce(b.priority,'')) when 'critical' then 25 when '90' then 25 when 'high' then 18 when 'medium' then 8 else 3 end)
    + (case when greatest(b.updated_at,coalesce(b.last_verified_at,'epoch'::timestamptz),coalesce(b.last_execution_at,'epoch'::timestamptz)) < now()-b.freshness_sla then 25 when greatest(b.updated_at,coalesce(b.last_verified_at,'epoch'::timestamptz),coalesce(b.last_execution_at,'epoch'::timestamptz)) < now()-(b.freshness_sla*0.70) then 12 else 0 end)
    + least(20,greatest(0,(400-(coalesce(b.brand_readiness,0)+coalesce(b.operational_readiness,0)+coalesce(b.revenue_readiness,0)+coalesce(b.technical_readiness,0)))/20))
  )::integer as attention_score
from base b;

grant select on public.enterprise_directory_intelligence to authenticated;
revoke all on public.enterprise_directory_intelligence from anon;

comment on view public.enterprise_directory_intelligence is
'Kollective Enterprise risk/freshness layer. Blockers, failed executions, priority, readiness gaps and status-specific freshness SLAs determine attention; alphabetical order is presentation only.';
