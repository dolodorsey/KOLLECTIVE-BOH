# CRM Department Deployment Status — 2026-09-03

## Current Verified Position

The 26 active non-beverage entities have complete basic HighLevel location/PIT/core-CRM readiness. The remaining native HighLevel blockers are two specific object-management permissions plus sender-readiness for a subset of brands.

**Credential architecture:** exact per-location PITs stored in Supabase and used only for the matching entity/location. No agency-level credential is required or assumed for this deployment, and credentials are never cross-used between brands.

### Enterprise CRM foundation

- 26 active non-beverage entities
- 15 canonical departments evaluated per entity
- 390 entity × department decisions
- 289 required department assignments
- 25 reusable department pipeline templates
- 599 active entity pipeline definitions
- 599 / 599 have owner-role coverage
- 599 / 599 have PM-role coverage
- 599 / 599 have stage, workflow, SLA and handoff specifications
- 32 Wave 1 entity-specific pipeline-to-messaging bindings

Canonical BOH tables:

- `public.crm_department_templates`
- `public.crm_entity_department_matrix`
- `public.crm_entity_pipeline_manifest`

Pipeline deployment waves:

- Wave 1 — 195 definitions
- Wave 2 — 147 definitions
- Wave 3 — 151 definitions
- Wave 4 — 106 definitions
- Total — 599

## GHL Location / PIT Reconciliation — Complete for Core CRM

- 26 / 26 active entities have a mapped GHL location.
- 26 / 26 have a matching entity/location PIT in Supabase.
- 26 / 26 pass core contact/conversation/CRM authentication.
- 26 / 26 support the custom-field/tag writes used by this operating system.

The active CRM runtime source of truth is now `public.crm_ghl_entity_runtime_map` in KOLLECTIVE BOH. It deliberately supersedes stale credential-strategy metadata in older broad mapping tables without rewriting historical records.

## Native GHL Capability Audit

Safe invalid-body endpoint probes were used so no test agents or pipelines were created.

### Conversation AI management

- 12 / 26 PITs are authorized for native Conversation AI agent management.
- 89 native entity-owned agents are already deployed across those 12 locations in `OFF` mode.
- 14 / 26 valid PITs return HTTP 401 on `POST /conversation-ai/agents` and require Conversation AI agent-management/write permission.
- 95 native agent rows remain explicitly `scope_blocked`.

Blocked 14:

- BARE
- BODEGA
- Brand Studio
- Clean Cut Landscaping
- Consultations
- Courses
- Frequency Productions
- Hakuna Matata
- Halloween General
- Halloween Women
- Halloween Sexy Women
- Mission 365
- Synergy Sounds
- Umbrella Auto Exchange

### Native pipeline creation

- 0 / 26 current PITs authorize `POST /opportunities/pipelines`.
- All 26 require granular `pipelines.create` on the existing entity Private Integration.
- All 599 active BOH pipeline definitions are `blocked_pipeline_create_scope` until this permission is proven.

No token rotation is required merely to edit the Private Integration permission set unless HighLevel itself requires it.

## Native CRM Configuration — Completed

The 26 locations have the common entity-safe CRM control layer:

- 260 / 260 required opportunity fields ready
- 288 / 288 required core/program tags ready
- 0 field errors
- 0 tag errors

## Native Pipeline Deployment Queue — Built

Migration: `crm_ghl_runtime_map_and_pipeline_queue`

New BOH assets:

- `public.crm_ghl_entity_runtime_map`
- `public.crm_ghl_pipeline_deployment_queue`
- `public.crm_rebuild_ghl_pipeline_deployment_queue()`
- `public.v_crm_ghl_pipeline_deployment_dashboard`

The queue materializes every active canonical pipeline with:

- exact entity GHL location ID
- exact pipeline name
- ordered stage payload derived from canonical `stage_spec`
- deployment wave
- deterministic idempotency key
- owner-role and PM-role metadata
- native pipeline ID/status placeholders
- retry/error/audit fields

Verified queue result:

- 599 / 599 active pipeline rows materialized
- 599 / 599 blocked only by pipeline-create scope
- 0 missing mappings/specs
- 0 queued prematurely
- 0 native pipelines falsely marked deployed

## Safe Scope Release Gate — Installed

Migration: `crm_safe_scope_probe_and_queue_release`

New BOH assets:

- `public.crm_ghl_scope_probe_log`
- `public.crm_record_ghl_scope_probe(...)`
- `public.v_crm_ghl_scope_probe_status`

The gate only treats HTTP **400 or 422** from an intentionally invalid-body probe as proof that authentication/authorization reached HighLevel payload validation.

- 401/403 → remains `scope_blocked`
- 404 → not authorized
- 5xx → not authorized
- unexpected 2xx from invalid probe → treated as unsafe and does **not** authorize

A successful pipeline scope probe releases only that entity's queued rows; it does not activate messaging or agents.

## Messaging OS — Verified

- 26 active brand profiles
- 158 messaging programs
- 632 email sequence steps
- 184 canonical conversation agents
- 26 data guards
- 78 active canonical draft routes
- 26 explicit sender mappings

QA remains clean:

- 158 / 158 synthetic program events routed correctly
- 632 / 632 generated emails remained test-only/gated
- 26 / 26 DNC tests suppressed with zero email output
- 78 / 78 canonical routes remain draft
- 0 active non-draft canonical routes
- 26 / 26 cross-brand isolation checks passed
- 26 / 26 objection/handoff checks passed

## Sender / Activation Readiness

- 14 / 26 entities currently have dedicated/non-fallback sender rows.
- 12 / 26 are explicitly on Kollective fallback and are blocked from unrestricted external activation.
- Help 911 already has owned domain `help911.help`, recorded address `dialhelp911@gmail.com`, and planned mailboxes `support@help911.help`, `partners@help911.help`, `claims@help911.help`; those mailboxes still require creation/connection and DNS/auth verification before switch-over.
- The other 11 fallback entities currently have no verified dedicated sender identity in the canonical sender/domain/mailbox records.

New MCP Gateway assets:

- `public.crm_sender_remediation_queue`
- `public.crm_rebuild_sender_remediation_queue()`
- `public.v_crm_sender_activation_gates`

No unverified `hello@...` address is invented or treated as production-ready.

## Program Activation Control — Built

New MCP Gateway assets:

- `public.crm_program_activation_plan`
- `public.crm_rebuild_program_activation_plan()`
- `public.v_crm_activation_exception_dashboard`

All 158 messaging programs are classified by risk and infrastructure readiness.

Current split:

- 82 low risk
- 13 medium risk
- 51 high risk
- 12 restricted
- 12 manual-only
- 11 first controlled burn-in candidates after infrastructure gates clear

First burn-in candidate order:

1. STUSH — welcome
2. STUSH — post-purchase
3. STUSH — abandoned cart
4. Good Times — reservations / experiences
5. Good Times — user acquisition
6. Good Times — marketing nurture
7. MAGA Merchandise — welcome
8. MAGA Merchandise — post-purchase
9. MAGA Merchandise — abandoned cart
10. Sole Exchange — impact updates
11. Sole Exchange — volunteers

All 11 are still blocked by native pipeline scope today. They are candidates for controlled internal burn-in after infrastructure remediation, **not permission to send now**.

Help 911, Mind Studio, capital/investor flows and other restricted/manual programs remain human-gated regardless of infrastructure readiness.

## Executive Exception Control

New MCP Gateway assets:

- `public.crm_execution_blockers`
- `public.crm_activation_executive_summary()`
- `public.v_crm_first_burnin_queue`

Verified executive summary:

- entities: 26
- core CRM ready: 26
- pipeline-scope-blocked entities: 26
- pipeline definitions waiting: 599
- Conversation-AI-scope-blocked entities: 14
- native agents remaining: 95
- sender-blocked entities: 12
- messaging programs: 158
- first burn-in candidates: 11
- live autonomous programs: 0
- real outbound activated by this control plane: false

## ClickUp Execution Binding

The central enterprise execution area is the correct destination for shared CRM/GHL work. The ClickUp connector returned a hard platform write-rate-limit window, so no duplicate folders/tasks were created in entity workspaces.

Four central execution actions remain defined:

1. `GHL | Add pipelines.create to 26 PITs`
2. `GHL | Add Conversation AI management scope to 14 PITs`
3. `CRM | Native pipeline + agent deployment after scopes`
4. `CRM | Production activation Wave 1`

## Security

Supabase security advisors were run after the new migrations. The new control tables use the internal service-only pattern: RLS enabled, public/anon/authenticated access revoked, service-role access retained, and SECURITY DEFINER functions use a fixed search path with public execution revoked.

Advisor warnings/errors elsewhere in the legacy projects predate this work and should be handled in a separate hardening pass; no material new security blocker was introduced by these CRM migrations.

## Immediate Remaining External Actions

1. In HighLevel Private Integrations, add `pipelines.create` to all 26 existing entity PIT permission sets.
2. Add Conversation AI agent-management permission to the 14 blocked PITs.
3. Re-run safe invalid-body probes and record them through `public.crm_record_ghl_scope_probe(...)`.
4. Mirror the remaining 95 native agents in `OFF` mode.
5. Release/deploy native pipelines by wave from `public.crm_ghl_pipeline_deployment_queue` with idempotent exact-name checks.
6. Resolve the 12 dedicated sender gates and validate real audience consent/eligibility.
7. Complete the central ClickUp execution binding when the connector limit clears.
8. Run only the controlled burn-in cohort before considering broader automation.

## Beverage Scope

Beverages remain out of this pass: BEVCO INTL., Infinity Water, Pronto, ORA, XXX Vodka, Privè Vodka, Noir, Otini, Tempo, Casa Cantina, and Island Water.

## Source Control

- Canonical department/pipeline architecture: `ops/crm/ACTIVE_ENTITY_DEPARTMENT_CRM_MANIFEST_2026-09-03.md`
- Messaging OS deployment/audit: `ops/crm/MESSAGING_OS_DEPLOYMENT_2026-09-03.md`
- Post-scope deployment runbook: `ops/crm/POST_SCOPE_NATIVE_DEPLOYMENT_RUNBOOK_2026-09-03.md`
- HighLevel permission remediation: GitHub issue #8
