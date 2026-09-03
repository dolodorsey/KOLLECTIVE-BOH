# CRM Department Deployment Status — 2026-09-03

## Completed

### Action 1 — Active Entity × Department Master Matrix
- 26 active entities in current CRM scope.
- 15 canonical enterprise departments evaluated per entity.
- 390 total entity × department decisions written to Supabase.
- 289 department assignments marked required for the current operating scope.
- Each row includes deployment wave, priority, department owner role, PM role, rationale, and status.

### Action 2 — Department Pipeline Operating Specs
- 25 reusable department pipeline templates written to Supabase.
- Each template includes stages, funnel path, workflow/automation rules, SLA, handoff rules, KPI set, owner role, and PM role.
- Required entity/department combinations were materialized into 599 active pipeline manifest rows.
- New internal tables:
  - `public.crm_department_templates`
  - `public.crm_entity_department_matrix`
  - `public.crm_entity_pipeline_manifest`
- All three tables have RLS enabled, no anon/authenticated read access, and service-role-only CRUD.

### Action 3 — Wave 1 Deployment Package
Wave 1 entities:
- Casper Group
- Good Times
- S.O.S.
- Mission 365
- Help 911
- Dr. Dorsey
- Hakuna Matata

32 entity-specific pipelines were added on top of the reusable department layer.

Wave 1 HighLevel locations already mapped in KOLLECTIVE BOH:
- Casper Group → `IPP6mHiRgKtIAHOOueHS`
- Good Times → `jbm4vUg0J1llNkK8q6Lt`
- S.O.S. → `jz8geHs33Iqyruo2q2oO`
- Mission 365 → `k0qCyTaLEJaIazRML7hs`
- Help 911 → `My8EzLOwxDNkXVKLbFBh`
- Dr. Dorsey → `FTJ4gOGLsZazXuve0YSY`
- Hakuna Matata → `my3t8XWT680gA5UWpoda`

## HighLevel Live Provisioning Blocker

Live pipeline/workflow/form provisioning is not complete because HighLevel authentication is blocked at both available paths:

1. Interactive HighLevel connector returns HTTP 401: `This authClass type is not allowed to access this scope.`
2. Direct KOLLECTIVE BOH integration is marked `degraded` because the agency-wide runtime secret `GHL_PRIVATE_INTEGRATION_TOKEN` is not actually present.

The backend has already verified that the intended model is one agency-shared credential inherited by all HighLevel subaccounts. Separate per-subaccount tokens are not required.

Required resolution recorded by KOLLECTIVE BOH:
`Place a valid HighLevel agency/private integration token into KOLLECTIVE BOH Edge Function secret GHL_PRIVATE_INTEGRATION_TOKEN, then run ghl-agency-shared-runtime revalidation.`

Until that credential is present, Wave 1 manifests remain `ghl_status = blocked_iam` rather than being falsely marked deployed.

## Source Control
- Canonical architecture manifest: `ops/crm/ACTIVE_ENTITY_DEPARTMENT_CRM_MANIFEST_2026-09-03.md`
- HighLevel IAM remediation issue: GitHub issue #8
