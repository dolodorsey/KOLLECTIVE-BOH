# Messaging OS Deployment — 2026-09-03

## Scope

This record covers the 26 active non-beverage entities in the current CRM/Messaging OS pass. The beverage portfolio remains intentionally excluded.

The operating rule remains strict entity isolation: each entity owns its own GHL location, PIT/private integration, CRM records, fields/tags, messaging programs, sender identity, router, specialist agents, data guard, channel routes, pipeline definitions, source triggers, and execution handoffs.

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
- 20 live source/event triggers
- 26 explicit sender mappings

All 78 canonical routes remain `draft`. Outbound dispatch remains gated. No canonical agent/route was moved into autonomous production during this pass.

## GHL Infrastructure Handoff — Reconciled

Claude completed the location/PIT plumbing and the result was independently reconciled against Supabase and the live HighLevel APIs.

### Basic location / credential / core CRM readiness

- 26 / 26 active non-beverage entities have a mapped HighLevel location.
- 26 / 26 have a matching per-location PIT in the authoritative Supabase credential path.
- 26 / 26 PITs pass core CRM/contact/conversation authentication.
- 26 / 26 support the custom-field and tag writes used by this CRM operating system.

The existence of a reactivated agency credential does not change the entity operating rule: production entity automation uses the exact location/entity credential and never cross-uses credentials between brands.

### New/mapped locations from the infrastructure handoff

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

## HighLevel Capability Truth — Independently Probed

The infrastructure handoff validated core CRM writes, but native object-management permissions are separate. A safe invalid-body capability probe was therefore run against the actual native endpoints. The probe creates no agents or pipelines; an HTTP 422 proves endpoint authorization while HTTP 401 proves missing scope.

### Conversation AI agent management

**12 / 26 entities are authorized and already mirrored natively:**

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

All 89 native agents remain `OFF` and their native IDs are mirrored into Supabase.

**14 / 26 entities have valid PITs/core CRM access but are missing Conversation AI agent-management permission:**

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

Their 95 canonical native-agent rows are explicitly marked `scope_blocked`, not pending. Required remediation: add the Conversation AI management/write permission used by `POST /conversation-ai/agents` to the existing Private Integration; do not rotate or cross-use tokens.

### Native pipeline creation

**0 / 26 current PITs are authorized for native pipeline creation.**

Every tested `POST /opportunities/pipelines` returned HTTP 401 with the current PITs. All 599 active pipeline definitions in KOLLECTIVE BOH are therefore marked:

`blocked_pipeline_create_scope`

Required remediation: add `pipelines.create` to each of the 26 existing entity PIT permission sets. The canonical pipeline/stage/workflow/SLA/handoff/KPI specifications remain complete in Supabase and do not need to be redesigned.

## All-Entity HighLevel CRM Configuration — Completed

A generalized 26-entity configuration layer was added in the MCP Gateway:

- `public.crm_ghl_field_map`
- `public.crm_ghl_tag_map`
- `public.crm_provision_ghl_fields_tags(brand_key)`

Verified native configuration result:

- 26 / 26 entity locations provisioned/reconciled
- 260 / 260 required opportunity CRM fields ready
- 288 / 288 entity/core/program tags ready
- 0 field provisioning errors
- 0 tag provisioning errors

Each entity has the standard opportunity control fields:

- KHG CRM Department
- KHG CRM Pipeline
- KHG CRM Stage
- KHG CRM Owner Role
- KHG CRM PM Role
- KHG CRM Next Action
- KHG CRM Next Action Date
- KHG CRM SLA Due
- KHG CRM Source Record ID
- KHG CRM Sync Status

Core/program tags are entity-local and include `crm_live_sync`, `crm_needs_owner`, `crm_sla_active`, `crm_messaging_ready`, `crm_human_escalation`, plus one `crm_program_*` tag for each active entity messaging program.

## Department / Pipeline Operating Layer

KOLLECTIVE BOH currently contains:

- 599 active pipeline definitions
- 26 active entities
- 14 departments represented across the active manifest
- 599 / 599 pipeline definitions have owner-role coverage
- 599 / 599 have PM-role coverage

The native GHL pipeline objects are the part blocked by `pipelines.create`; their operating specifications are not blocked.

## Sender Readiness

- 26 / 26 entities have an explicit sender mapping.
- 14 / 26 currently use a dedicated/non-fallback brand sender row.
- 12 / 26 remain explicitly marked Kollective fallback and need a dedicated brand sender before unrestricted production outbound.

Fallback entities:

- BARE
- BODEGA
- Brand Studio
- Clean Cut Landscaping
- Consultations
- Courses
- Frequency Productions
- Halloween General
- Halloween Women
- Halloween Sexy Women
- The Mind Studio
- Synergy Sounds

No entity silently inherits Dr. Dorsey's sender identity.

## QA / Safety State

Existing full messaging QA remains valid:

- 158 / 158 synthetic program events routed correctly
- 632 / 632 generated email steps remained test-only/gated
- 26 / 26 DNC simulations suppressed with zero email output
- 78 / 78 canonical routes active in draft mode
- 0 active non-draft canonical routes
- 26 / 26 cross-brand isolation tests passed
- 26 / 26 objection/handoff tests passed
- 184 / 184 canonical agents accounted for

High-risk legal/medical/clinical/capital/custom-terms/complaint scenarios remain human-gated.

## New Control-Plane Assets Added During Takeover

MCP Gateway migrations / assets:

- `crm_native_mirror_accept_pit_validated`
- `crm_ghl_native_scope_truth_audit`
- `crm_all_entity_ghl_fields_tags_registry`
- `crm_entity_go_live_readiness_registry`
- `public.crm_ghl_capability_audit`
- `public.crm_entity_go_live_readiness`
- `public.crm_probe_ghl_config_write_scopes(...)`
- `public.crm_refresh_entity_go_live_readiness()`

All new control-plane tables have RLS enabled and are service-role-only. New SECURITY DEFINER functions use a fixed search path and have execute revoked from public/anon/authenticated.

The Supabase security advisor found no new material warning attributable to these new tables/functions. The broader legacy project still contains existing advisor debt that should be handled as a separate security-hardening pass.

## Current Go-Live Gates

Core CRM configuration is ready for 26 / 26 entities. Live activation remains gated by the following real dependencies:

1. Add `pipelines.create` to all 26 entity PIT permission sets.
2. Add Conversation AI agent-management permission to the 14 newly provisioned/mapped PITs listed above.
3. Create/verify dedicated sender identities for the 12 entities currently on explicit Kollective fallback.
4. Review live audiences/contact consent before any real outbound campaign activation.
5. Complete ClickUp execution binding when ClickUp write rate limiting clears.
6. After scopes are fixed, rerun capability probes, mirror the 95 blocked native agents in `OFF` mode, then deploy native pipeline objects in controlled waves.

## Known Architecture Exceptions Requiring Separate Decision

- STUSH duplicate: canonical `2rlQ89TGyca6NZaFugHN`; duplicate `iMnrTkqOiutj7ayQMeFT` remains unresolved. The duplicate reportedly holds a large mixed cross-brand Houston contact population; do not merge automatically.
- On Call duplicate: canonical `TPGXRZ0h4ClKDbQFu5ew`; duplicate `TPyMj9PwUj9WRkAt4v0Y` remains unresolved.
- MAGA Merchandise currently shares main MAGA location `OR94o2hKNXj1tIopbmuw`; dedicated-location separation remains an explicit architecture decision.
- Location `8dQDGCzUtKCVK9laectZ` has a Supabase/HighLevel identity mismatch and must not receive Kollective traffic until ownership is resolved.

## Beverage Scope

Not included in this deployment pass: BEVCO INTL., Infinity Water, Pronto, ORA, XXX Vodka, Privè Vodka, Noir, Otini, Tempo, Casa Cantina, and Island Water.
