# KHG AUTONOMY OS

Production control-plane reference for The Kollective Hospitality Group.

## Canonical Backend

Supabase project: `KOLLECTIVE BOH` (`wfkohcwxxsrhcxhepfql`).

### Canonical enterprise identity

Use `enterprise_directory_records` as the enterprise entity source of truth.

Supporting canonical tables:
- `company_directory_profiles`
- `company_operating_profiles`
- `company_annual_plans`
- `company_channel_plans`
- `company_team_assignments`
- `company_platform_accounts`
- `execution_portfolios`
- `execution_portfolio_members`
- `entity_owners`

Do not collapse parent/child/sibling brands. Every entity remains independently accountable, measured, marketed, approved, and reported.

## Autonomous Control Plane

Core tables:
- `enterprise_departments`
- `agent_blueprints`
- `agents`
- `enterprise_objectives`
- `tasks`
- `scheduled_operations`
- `enterprise_incidents`
- `agent_run_log`
- `enterprise_skill_registry`
- `agent_skill_assignments`
- `enterprise_action_policies`
- `platform_resource_registry`

Status view:
- `enterprise_autonomy_status`

Execution RPCs:
- `run_enterprise_autonomy_tick()`
- `run_enterprise_health_sweep()`
- `claim_next_agent_task()`
- `finish_agent_task()`
- `release_expired_agent_task_leases()`
- `run_enterprise_mac_maintenance()`

Authenticated dispatcher:
- Edge Function `enterprise-agent-dispatcher`

## Agent Hierarchy

1. Enterprise Command
2. Department Governors
3. Division Governors
4. Entity GM Agents
5. Event Commanders where applicable
6. Entity specialist agents: Finance, Growth, Revenue, Operations, Compliance, Creative, Data, People
7. Advanced Growth Fleet: Marketing Strategy, Social Media, Engagement, Outreach, Sponsorship, Grants, Ambassador/Influencer, Lead Intelligence, Growth Data, Marketing Automation
8. Platform and Security Watchdogs

Agents may coordinate shared systems, but may not silently merge independent entity data or reporting.

## Scheduler

`pg_cron` is enabled.

Active jobs:
- `khg-enterprise-autonomy-tick` — every 5 minutes
- `khg-agent-lease-reaper` — every 10 minutes
- `khg-mac-maintenance` — daily

Recurring enterprise operations are stored in `scheduled_operations`; do not rely on humans remembering to run them.

## Advanced Growth OS

Marketing and growth are operated as a measurable entity-isolated system, not a collection of disconnected posts or outreach lists.

Canonical Growth OS tables:
- `growth_programs`
- `growth_audience_segments`
- `growth_content_operations`
- `growth_social_engagement_targets`
- `growth_relationships`
- `growth_sponsor_opportunities`
- `growth_grant_opportunities`
- `growth_ambassador_programs`
- `growth_ambassador_members`
- `growth_signal_events`
- `growth_data_usage_registry`
- `growth_attribution_touchpoints`
- `growth_experiments`
- `growth_automation_playbooks`
- `growth_automation_runs`
- `growth_capability_profiles`
- `growth_source_performance`
- `growth_pipeline_slas`
- `growth_daily_scorecards`

Command views:
- `v_growth_lead_command`
- `v_growth_relationship_command`
- `v_growth_source_economics`
- `v_growth_entity_command_center`

Every operating entity has a `growth-engine:<entity_key>` objective and an always-on growth program. Capability profiles decide whether sponsors, grants, ambassadors/influencers and affiliate systems are applicable so the scheduler does not blindly create irrelevant work.

### Growth attack cadence
- marketing strategy — daily
- social programming — daily
- strategic engagement — morning, afternoon and evening
- qualified outreach — daily
- sponsor pipeline — daily where applicable
- grant pipeline — daily where applicable
- ambassador/influencer pipeline — daily where applicable
- lead/intent sourcing — every 3 hours
- data/attribution audit — every 6 hours
- growth automation QA — every 6 hours

### Growth data rule
Every dataset must declare source type, allowed and prohibited purposes, consent/contact-use rules, retention, sharing, enrichment and cross-entity permissions before automation can rely on it. Cross-entity person-level use is denied by default.

### Growth automation standard
All playbooks follow: trigger → entity/data-rights validation → normalize → dedupe/idempotency → permitted enrichment → score/route → action gate → result write → evidence → retry/dead-letter → escalation.

Automation is not complete until successful runs, failure handling, evidence and no-dead-end routing are proven.

## Action Guardrails

`enterprise_action_policies` is authoritative.

Default posture:
- internal reads/research: automatic
- reversible internal writes: automatic + logged
- external drafts: automatic
- external sends/public publishing: channel/policy gated
- financial commitments: human approval
- contracts/legal/regulatory actions: human approval
- regulated-category actions: human approval
- destructive infrastructure changes: human approval + archive/rollback first
- cross-brand customer/prospect data: denied by default

## Legacy / Migration Rules

### `brand_configurations`
Retain read-only until old BOH code is migrated. Sender fields are deprecated. Canonical sender truth is `communication_sender_profiles`.

### `brands`
Legacy empty generic brand table. Do not add new records. Migrate remaining foreign keys before dropping.

### `entities` / `entity_members`
Legacy/mid-generation application authorization layer still used by existing BOH screens. Do not remove until UI/RBAC is migrated to the enterprise directory/team assignment model.

### `webhook_registry`
Legacy zero-row workflow registry includes n8n-era endpoint structure. Do not build new workflows on it. Migrate any remaining UI dependency to the autonomous control plane, then archive.

### `orgs`
Legacy duplicate of canonical `organizations`. Migrate `activity_log` dependency before archive.

### early generic BOH tables
`users`, `locations`, `user_locations`, `chats`, `alerts`, `incidents`, `training_modules`, and `user_training_progress` are legacy candidates. Preserve until dependency/code migration is verified; do not create new product logic on them.

## Archive Policy

Never delete merely because a resource is empty, old, or low-usage.

A resource can be automatically archived only when the evidence is strong: canonical replacement exists, no active dependency is found, purpose was temporary/completed, or endpoint is already disabled. Otherwise mark `archive_candidate` or `retain_readonly` in `platform_resource_registry`.

## Completion Standard

The enterprise does not accept fake completion.

A system is not complete if:
- an agent exists but never runs
- a scheduler exists but has no successful run
- a queue only accumulates work
- a sender is enabled but not connected
- a website exists but the conversion path fails
- an objective has no owner or attack cadence
- an archive candidate still receives production traffic
- automation depends on a human remembering to start it

Every completed autonomous task must produce evidence, result, blocker state, owner, and next action.
