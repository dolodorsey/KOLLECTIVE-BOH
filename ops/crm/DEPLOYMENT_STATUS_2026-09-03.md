# CRM Department Deployment Status — 2026-09-03

## Completed

### Action 1 — Active Entity × Department Master Matrix
- 26 active non-beverage entities in current CRM scope.
- 15 canonical enterprise departments evaluated per entity.
- 390 total entity × department decisions written to Supabase.
- 289 department assignments marked required for the current operating scope.
- Each row includes deployment wave, priority, department owner role, PM role, rationale, and status.

### Action 2 — Department Pipeline Operating Specs
- 25 reusable department pipeline templates written to Supabase.
- Each template includes stages, funnel path, workflow/automation rules, SLA, handoff rules, KPI set, owner role, and PM role.
- Required entity/department combinations were materialized into 599 active pipeline manifest rows.
- Internal tables:
  - `public.crm_department_templates`
  - `public.crm_entity_department_matrix`
  - `public.crm_entity_pipeline_manifest`
- All three tables use RLS/internal service-control access.

### Action 3 — Wave 1 CRM Package
Wave 1 entities:
- Casper Group
- Good Times
- S.O.S.
- Mission 365
- Help 911
- Dr. Dorsey
- Hakuna Matata

32 entity-specific pipelines were added on top of the reusable department layer and bound to the Messaging OS where applicable.

Wave 1 HighLevel locations already mapped in KOLLECTIVE BOH:
- Casper Group → `IPP6mHiRgKtIAHOOueHS`
- Good Times → `jbm4vUg0J1llNkK8q6Lt`
- S.O.S. → `jz8geHs33Iqyruo2q2oO`
- Mission 365 → `k0qCyTaLEJaIazRML7hs`
- Help 911 → `My8EzLOwxDNkXVKLbFBh`
- Dr. Dorsey → `FTJ4gOGLsZazXuve0YSY`
- Hakuna Matata → `my3t8XWT680gA5UWpoda`

## Messaging OS — Verified

The entity-specific Messaging OS is now materially built and QA-verified in Supabase:

- 26 active brand profiles
- 158 messaging programs
- 632 email sequence steps
- 184 active canonical conversation agents: 158 specialists + 26 entity routers
- 26 entity data guards
- 78 active draft routes: email, SMS, Instagram per entity
- 32 Wave 1 pipeline-to-messaging bindings
- 20 live source/event triggers
- 26 explicit sender mappings

Synthetic QA results:
- 158 / 158 program events routed to the correct specialist
- 632 / 632 generated email steps remained test-only and gated
- 26 / 26 DNC tests suppressed with 0 emails created
- 78 / 78 canonical channel routes active in draft mode
- 0 active non-draft canonical routes
- 26 / 26 cross-brand isolation checks passed
- 26 / 26 objection/handoff checks passed
- 184 / 184 expected canonical agents active; 0 missing and 0 unexpected

Legacy cleanup:
- 21 duplicate/unsafe legacy routes blocked and retained only for audit/recovery
- 1 legacy STUSH conversation agent disabled
- unrelated legacy native HighLevel agents previously found under incorrect entity locations were moved to OFF mode rather than deleted

Full record: `ops/crm/MESSAGING_OS_DEPLOYMENT_2026-09-03.md`

## HighLevel Credential Architecture — Corrected

The earlier assumption that the enterprise required one agency-wide `GHL_PRIVATE_INTEGRATION_TOKEN` was incorrect and is retired.

**Actual model:** each native HighLevel location uses its own exact per-location PIT stored in Supabase. A credential may only be used for the GHL location/entity it belongs to.

Current native Conversation AI state:

### Credential-ready / mirrored
89 new native HighLevel agents are deployed in OFF mode across 12 entities:
- Casper Group — 7
- Dr. Dorsey — 8
- Good Times — 9
- Help 911 — 7
- Make Atlanta Great Again Merchandise — 7
- The Mind Studio — 6
- On Call — 8
- The People's Dept. — 6
- Sole Exchange — 7
- S.O.S. — 8
- STUSH — 9
- The Kollective — 7

### Location exists, exact current PIT not found in active/current credential mirrors
- BARE — `GrP82FcIfLmZZYM4CLo1`
- Clean Cut — `PNGsYICyiZcRQIfwbXVD`
- Frequency Productions — `Zm9L9yJnfEqIyUNlMmRh`
- Hakuna Matata — `my3t8XWT680gA5UWpoda`
- Halloween General — `Xl00ZeWTpZmay17o74Sw`
- Mission 365 — `k0qCyTaLEJaIazRML7hs`
- Synergy Sounds — `vHT7U9MIunt8Tl13nurI`
- Umbrella Auto Exchange — `dBHdPA05U62NuOD4K5oo`

Mission 365's own project vault was checked and contains no current GHL PIT.

### No native location mapping yet
- Bodega
- Brand Studio
- Consultations
- Courses
- Halloween Women
- Halloween Sexy Women

Legacy GHL credentials deliberately deactivated on 2026-07-28 are not treated as current credentials and are not cross-used or reactivated without exact entity/location validation.

## Activation Gate

All new native Conversation AI agents remain `OFF`, and all canonical Supabase routes remain `draft`. No agent or outbound sequence becomes autonomous until sender identity, consent/suppression behavior, entity isolation, program simulation, pipeline/source routing, objections/escalations, and responsible human owner/PM are verified.

## Scope Note

Beverages remain outside this deployment pass: BEVCO INTL., Infinity Water, Pronto, ORA, XXX Vodka, Privè Vodka, Noir, Otini, Tempo, Casa Cantina, and Island Water.

## Source Control
- Canonical CRM architecture: `ops/crm/ACTIVE_ENTITY_DEPARTMENT_CRM_MANIFEST_2026-09-03.md`
- Messaging OS deployment/audit: `ops/crm/MESSAGING_OS_DEPLOYMENT_2026-09-03.md`
- HighLevel per-location PIT reconciliation: GitHub issue #8
