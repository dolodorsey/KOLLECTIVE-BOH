# Messaging OS Deployment — 2026-09-03

## Scope

This record covers the 26 active non-beverage entities in the current CRM/Messaging OS pass. The beverage portfolio remains intentionally excluded.

The operating rule is strict entity isolation: each entity owns its own GHL location, exact per-location PIT/private integration, CRM records, fields/tags, messaging programs, sender identity, router, specialist agents, data guard, channel routes, pipeline definitions, source triggers and execution handoffs.

No agency-level credential is required or assumed for this deployment. Credentials are never cross-used between entities.

## Canonical Messaging OS — Verified

- 26 active brand profiles
- 158 entity-specific messaging programs
- 632 preprogrammed email sequence steps
- 184 canonical conversation agents
  - 158 specialists
  - 26 entity routers
- 26 entity data guards
- 78 active canonical channel routes: email + SMS + Instagram
- 32 Wave 1 pipeline-to-messaging bindings
- 26 explicit sender mappings

All canonical routes remain `draft`. Outbound dispatch remains gated. No canonical agent/route was moved into autonomous production during this pass.

## GHL Infrastructure — Core CRM Ready

- 26 / 26 entities have an exact mapped HighLevel location.
- 26 / 26 have a matching per-location PIT in Supabase.
- 26 / 26 pass core CRM/contact/conversation authentication.
- 26 / 26 support the custom-field and tag writes used by the CRM operating system.
- 260 / 260 required opportunity CRM fields are provisioned.
- 288 / 288 required entity/core/program tags are provisioned.

Supabase remains the canonical control plane.

## Native Conversation AI

### Already mirrored

89 native HighLevel agents are deployed across 12 entities, all in `OFF` mode:

| Entity | Native OFF agents |
|---|---:|
| Casper Group | 7 |
| Dr. Dorsey | 8 |
| Good Times | 9 |
| Help 911 | 7 |
| Make Atlanta Great Again Merchandise | 7 |
| The Mind Studio | 6 |
| On Call | 8 |
| The People's Dept. | 6 |
| Sole Exchange | 7 |
| S.O.S. | 8 |
| STUSH | 9 |
| The Kollective | 7 |
| **Total** | **89** |

### Scope-blocked

The following 14 valid PITs/core-CRM locations return HTTP 401 on native agent creation and need Conversation AI agent-management permission added:

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

They represent 95 remaining native agents. Their rows are `scope_blocked`, not pending. When the permission is proven, mirror them and verify every new native agent remains `OFF`.

## Native Pipeline Creation

All 26 current PITs return HTTP 401 on `POST /opportunities/pipelines`. All require granular `pipelines.create` before native pipeline creation.

The pipeline architecture itself is complete:

- 599 active canonical pipeline definitions
- 599 / 599 owner-role coverage
- 599 / 599 PM-role coverage
- 599 / 599 stage/workflow/SLA/handoff specs
- Wave 1: 195
- Wave 2: 147
- Wave 3: 151
- Wave 4: 106

A native deployment queue has been materialized in KOLLECTIVE BOH:

- `public.crm_ghl_entity_runtime_map`
- `public.crm_ghl_pipeline_deployment_queue`
- `public.crm_rebuild_ghl_pipeline_deployment_queue()`
- `public.v_crm_ghl_pipeline_deployment_dashboard`

Verified queue state:

- 599 / 599 exact entity/location mappings
- 599 / 599 API-ready ordered stage payloads
- deterministic idempotency keys
- 599 blocked only by pipeline-create scope
- 0 prematurely queued or falsely deployed

## Safe Permission-Probe Gate

KOLLECTIVE BOH also contains:

- `public.crm_ghl_scope_probe_log`
- `public.crm_record_ghl_scope_probe(...)`
- `public.v_crm_ghl_scope_probe_status`

Only an HTTP 400 or 422 from the deliberately invalid-body HighLevel probe is accepted as proof that authorization reached payload validation.

- 401/403 remain blocked
- 404 remains blocked/indeterminate
- 5xx remains blocked/indeterminate
- an unexpected 2xx is not treated as authorization because the invalid probe must never create/accept a real object

For pipeline scope, a valid probe releases only the matching entity's queue rows; it does not activate messaging or Conversation AI.

## Sender Readiness — Corrected

- 26 / 26 entities have an explicit sender mapping.
- 14 / 26 have dedicated/non-fallback sender rows.
- 12 / 26 remain on explicit Kollective fallback and are activation-gated.

Current fallback entities:

- BARE
- Clean Cut Landscaping
- Consultations
- Courses
- Frequency Productions
- Hakuna Matata
- Halloween General
- Halloween Women
- Halloween Sexy Women
- Help 911
- Mission 365
- Synergy Sounds

BODEGA, Brand Studio and The Mind Studio are **not** in the current fallback set.

Help 911 is the one fallback entity with an existing recovery path already recorded:

- owned domain: `help911.help`
- recorded address: `dialhelp911@gmail.com`
- planned mailboxes: `support@help911.help`, `partners@help911.help`, `claims@help911.help`
- status: planned / requires creation or connection plus DNS/auth verification

The other 11 fallback entities currently have no verified dedicated sender identity in the canonical sender/domain/mailbox records. No guessed `hello@...` address is treated as real.

Sender control assets:

- `public.crm_sender_remediation_queue`
- `public.crm_rebuild_sender_remediation_queue()`
- `public.v_crm_sender_activation_gates`

## Program Activation Control

All 158 programs have been classified by risk and readiness in:

- `public.crm_program_activation_plan`
- `public.crm_rebuild_program_activation_plan()`
- `public.v_crm_activation_exception_dashboard`

Verified risk split:

- 82 low
- 13 medium
- 51 high
- 12 restricted
- 12 manual-only

No program is autonomous.

### First controlled burn-in cohort after infrastructure gates clear

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

These 11 are candidates only. They are still blocked by native pipeline scope today, and real outbound additionally requires sender testing plus audience-level consent/eligibility validation.

Help 911 and Mind Studio stay human/manual for sensitive flows. Capital/investor communication and other restricted/custom-term/high-risk programs remain human-gated even after infrastructure is available.

## Executive Control Layer

MCP Gateway now contains:

- `public.crm_execution_blockers`
- `public.crm_activation_executive_summary()`
- `public.v_crm_first_burnin_queue`

Current verified summary:

- 26 entities
- 26 core CRM ready
- 26 pipeline-scope blocked
- 599 pipeline definitions waiting
- 14 Conversation-AI-scope blocked
- 95 native agents remaining
- 12 sender-blocked entities
- 158 messaging programs
- 11 first burn-in candidates
- 0 autonomous programs
- 0 real outbound activated by this control plane

## QA / Safety State

Existing QA remains valid:

- 158 / 158 synthetic program events routed correctly
- 632 / 632 generated email steps remained test-only/gated
- 26 / 26 DNC simulations suppressed with zero email output
- 78 / 78 canonical routes remain draft
- 0 active non-draft canonical routes
- 26 / 26 cross-brand isolation tests passed
- 26 / 26 objection/handoff tests passed
- 184 / 184 canonical agents accounted for

High-risk legal/medical/clinical/capital/custom-terms/complaint scenarios remain human-gated.

## ClickUp

The central enterprise execution area is the correct destination for shared CRM/GHL infrastructure actions. A hard ClickUp connector write-rate limit was observed, so no duplicate tasks were created in entity workspaces.

The four intended central actions are:

1. `GHL | Add pipelines.create to 26 PITs`
2. `GHL | Add Conversation AI management scope to 14 PITs`
3. `CRM | Native pipeline + agent deployment after scopes`
4. `CRM | Production activation Wave 1`

## Security

The new CRM/messaging control tables use the internal service-only pattern: RLS enabled, public/anon/authenticated access revoked and service-role access retained. SECURITY DEFINER control functions use a fixed search path and public execution is revoked.

Supabase security advisors were run. No material new security blocker was introduced by these migrations; existing legacy-project advisor debt remains a separate hardening stream.

## Current External Gates

1. Add `pipelines.create` to the existing per-location Private Integration for all 26 active entities.
2. Add Conversation AI agent-management permission to the 14 blocked entity PITs.
3. Record safe authorization probes; do not release queues from 401/403/404/5xx/unsafe 2xx outcomes.
4. Mirror the remaining 95 native agents in `OFF` mode.
5. Deploy native pipelines in controlled Wave 1→4 order using the idempotent queue.
6. Resolve the 12 sender activation gates and validate real audience consent/eligibility.
7. Run only the 11-program controlled burn-in cohort first.
8. Keep restricted/manual programs human-controlled.

## Known Architecture Exceptions

- STUSH duplicate: canonical `2rlQ89TGyca6NZaFugHN`; duplicate `iMnrTkqOiutj7ayQMeFT` remains unresolved and must not be automatically merged.
- On Call duplicate: canonical `TPGXRZ0h4ClKDbQFu5ew`; duplicate `TPyMj9PwUj9WRkAt4v0Y` remains unresolved.
- MAGA Merchandise currently shares `OR94o2hKNXj1tIopbmuw`; dedicated-location separation remains a deliberate architecture decision.
- Location `8dQDGCzUtKCVK9laectZ` has a Supabase/HighLevel identity mismatch and must not receive Kollective traffic until ownership is resolved.

## Beverage Scope

Not included in this deployment pass: BEVCO INTL., Infinity Water, Pronto, ORA, XXX Vodka, Privè Vodka, Noir, Otini, Tempo, Casa Cantina and Island Water.

## Runbook

Post-scope deployment procedure: `ops/crm/POST_SCOPE_NATIVE_DEPLOYMENT_RUNBOOK_2026-09-03.md`
