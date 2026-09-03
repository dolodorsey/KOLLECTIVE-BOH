# CRM Department Deployment Status — 2026-09-03

## Current Verified Position

The 26 active non-beverage entities now have complete basic HighLevel location/PIT/core-CRM readiness. The remaining HighLevel blockers are no longer missing accounts or generic IAM: they are two specific native-object permissions.

### Enterprise CRM foundation

- 26 active non-beverage entities
- 15 canonical departments evaluated per entity
- 390 entity × department decisions
- 289 required department assignments
- 25 reusable department pipeline templates
- 599 active entity pipeline definitions
- 599 / 599 pipeline definitions have owner-role coverage
- 599 / 599 have PM-role coverage
- 32 Wave 1 entity-specific pipeline-to-messaging bindings

Canonical BOH tables:

- `public.crm_department_templates`
- `public.crm_entity_department_matrix`
- `public.crm_entity_pipeline_manifest`

## GHL Location / PIT Reconciliation — Complete for Core CRM

- 26 / 26 active entities have a mapped GHL location.
- 26 / 26 have a matching entity/location PIT in Supabase.
- 26 / 26 pass core contact/conversation/CRM authentication.
- 26 / 26 can perform the custom-field/tag writes used by this operating system.

The operating architecture remains per-entity/per-location even though an agency credential also exists. Entity automation does not cross-use credentials.

### Newly created/mapped or PIT-repaired locations

- BARE — `GrP82FcIfLmZZYM4CLo1`
- BODEGA — `MhjDux8DfQuIgZOs6bb4`
- Brand Studio — `vNSvkuoyfU31H6L2bPcj`
- Clean Cut Landscaping — `PNGsYICyiZcRQIfwbXVD`
- Consultations — `UvskhCIb0elwrGX2M7qi`
- Courses — `ZqGXVAJYb0ETyNLxykf1`
- Frequency Productions — `Zm9L9yJnfEqIyUNlMmRh`
- Hakuna Matata — `my3t8XWT680gA5UWpoda`
- Halloween General — `Xl00ZeWTpZmay17o74Sw`
- Halloween Women — `llEyWx8E3AoBgvNBThkk`
- Halloween Sexy Women — `6WJTNsGNIcyo5HB2MoI2`
- Mission 365 — `k0qCyTaLEJaIazRML7hs`
- Synergy Sounds — `vHT7U9MIunt8Tl13nurI`
- Umbrella Auto Exchange — `dBHdPA05U62NuOD4K5oo`

## Native GHL Capability Audit

A safe endpoint-level authorization probe was run for all 26 current PITs. Invalid payloads were used so no test agents or pipelines were created.

### Conversation AI management

- 12 / 26 PITs are authorized for native Conversation AI agent management.
- 89 native entity-owned agents are already deployed across those 12 locations in `OFF` mode.
- 14 / 26 newly provisioned/mapped PITs return HTTP 401 on `POST /conversation-ai/agents` and therefore require the Conversation AI agent-management/write permission.
- 95 native agent rows are explicitly marked `scope_blocked` until that permission is added.

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

- 0 / 26 current PITs are authorized for `POST /opportunities/pipelines`.
- All 26 need `pipelines.create` added to their existing Private Integration permissions.
- All 599 active BOH pipeline definitions are marked `blocked_pipeline_create_scope` until this permission is present.

The pipeline specs themselves are complete and retain stage, funnel, workflow, SLA, handoff, KPI, owner-role and PM-role configuration.

## Native CRM Configuration — Completed

The 26 locations now have a common entity-safe CRM control layer:

- 260 / 260 required opportunity fields ready
- 288 / 288 required core/program tags ready
- 0 field errors
- 0 tag errors

Generic control registries in MCP Gateway:

- `public.crm_ghl_field_map`
- `public.crm_ghl_tag_map`

Provisioner:

- `public.crm_provision_ghl_fields_tags(brand_key)`

## Messaging OS — Verified

- 26 active brand profiles
- 158 messaging programs
- 632 email sequence steps
- 184 canonical conversation agents
- 26 data guards
- 78 active canonical draft routes
- 20 live source/event triggers
- 26 sender mappings

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
- 12 / 26 are explicitly using Kollective fallback and need a dedicated brand sender before unrestricted production outbound.
- Live audience/consent review is still required before any real outbound activation.
- No real outbound campaign has been activated in this pass.

## Go-Live Readiness Control Plane

New internal MCP Gateway assets:

- `public.crm_ghl_capability_audit`
- `public.crm_entity_go_live_readiness`
- `public.crm_probe_ghl_config_write_scopes(...)`
- `public.crm_refresh_entity_go_live_readiness()`

Current summary:

- Core CRM ready: 26 / 26
- Standard field sets ready: 26 / 26
- Native AI fully mirrored: 12 / 26
- Native pipeline-create scope ready: 0 / 26
- Dedicated/non-fallback sender rows: 14 / 26
- Outbound: gated

## ClickUp Execution Binding

A central Enterprise Systems → CRM/GHL/Messaging OS execution area was selected for the shared infrastructure work. The first ClickUp write attempt returned a platform `429 RATE_LIMIT_REACHED`, so no duplicate folders/tasks were created elsewhere.

Planned central action objects remain deliberately limited to real execution items:

1. `GHL | Add pipelines.create to 26 PITs`
2. `GHL | Add Conversation AI management scope to 14 PITs`
3. `CRM | Native pipeline + agent deployment after scopes`
4. `CRM | Production activation Wave 1`

## Security

The Supabase security advisor was run after the new control-plane migrations. No new material advisor warning was identified as being caused by the newly created service-only CRM tables/functions. Existing project-wide legacy security-advisor debt remains and should be handled as a separate hardening pass.

## Known Architecture Exceptions

Do not resolve these by merging data automatically:

- STUSH duplicate: canonical `2rlQ89TGyca6NZaFugHN` vs duplicate `iMnrTkqOiutj7ayQMeFT`.
- On Call duplicate: canonical `TPGXRZ0h4ClKDbQFu5ew` vs duplicate `TPyMj9PwUj9WRkAt4v0Y`.
- MAGA Merchandise shares `OR94o2hKNXj1tIopbmuw`; dedicated-location separation remains a deliberate architecture decision.
- `8dQDGCzUtKCVK9laectZ` has a Supabase/HighLevel identity mismatch and must not receive Kollective traffic until ownership is resolved.

## Immediate Remaining Actions

1. Add `pipelines.create` to all 26 current per-location PITs.
2. Add Conversation AI agent-management permission to the 14 blocked PITs.
3. Re-probe authorization; successful invalid-body probes should return validation errors rather than 401.
4. Mirror the remaining 95 native agents in `OFF` mode.
5. Deploy the 599 native pipeline objects in controlled waves from the existing BOH specs.
6. Resolve the 12 dedicated sender gaps and live audience consent/eligibility.
7. Complete ClickUp execution bindings when write capacity is available.
8. Run controlled Wave 1 production burn-in before any broader automation activation.

## Beverage Scope

Beverages remain out of this pass: BEVCO INTL., Infinity Water, Pronto, ORA, XXX Vodka, Privè Vodka, Noir, Otini, Tempo, Casa Cantina, and Island Water.

## Source Control

- Canonical department/pipeline architecture: `ops/crm/ACTIVE_ENTITY_DEPARTMENT_CRM_MANIFEST_2026-09-03.md`
- Messaging OS deployment/audit: `ops/crm/MESSAGING_OS_DEPLOYMENT_2026-09-03.md`
- HighLevel permission remediation: GitHub issue #8
