# CRM Department Deployment Status — 2026-09-03

## Current Verified Position

The native non-beverage CRM infrastructure is complete for all 26 active entities. Remaining work is production readiness: dedicated senders, real eligible audiences, controlled burn-in and ClickUp task flushing when its connector write limit clears.

**Credential architecture:** exact per-location PITs only. No agency/shared credential is used for entity writes.

## Enterprise CRM Foundation

- 26 active non-beverage entities
- 15 canonical departments evaluated per entity
- 390 entity × department decisions
- 289 required department assignments
- 25 reusable department pipeline templates
- 599 active entity pipeline definitions
- 599/599 owner-role coverage
- 599/599 PM-role coverage
- 599/599 stage/workflow/SLA/handoff specifications
- 32 Wave 1 pipeline-to-messaging bindings

Canonical BOH assets:

- `public.crm_department_templates`
- `public.crm_entity_department_matrix`
- `public.crm_entity_pipeline_manifest`
- `public.crm_ghl_entity_runtime_map`
- `public.crm_ghl_pipeline_deployment_queue`

## HighLevel Location / PIT / Permission State — COMPLETE

- 26/26 mapped GHL locations
- 26/26 exact per-location PITs
- 26/26 core CRM authentication
- 26/26 `pipelines.create` independently verified by HTTP 422 invalid-body probes and proven by native writes
- 26/26 Conversation AI manage/write independently verified by HTTP 422 invalid-body probes and proven by native writes
- 260/260 required opportunity fields ready
- 288/288 required core/program tags ready

## Native Pipelines — COMPLETE

Deployment waves:

- Wave 1 — 195/195
- Wave 2 — 147/147
- Wave 3 — 151/151
- Wave 4 — 106/106
- **Total — 599/599**

Final native receipts:

- 598 `deployed`
- 1 `already_exists` (the initial idempotent canary)
- 599 with native GHL IDs
- 0 failures

BOH deployment queue reconciliation:

- 598 `deployed`
- 1 `already_exists`
- 599 with native IDs
- 0 blocked/queued/error rows remaining for the canonical manifest

Exact entity/location locking was preserved. Canonical STUSH and On Call locations were used; duplicate locations remained untouched.

## Native Conversation AI — COMPLETE / OFF

- 184/184 canonical agents have native GHL IDs
- 184/184 native agents remain `OFF`
- 0 missing native IDs
- 0 non-OFF native agents

Native infrastructure completion does not authorize autonomous operation.

## Messaging OS — VERIFIED

- 26 active brand profiles
- 158 messaging programs
- 632 email sequence steps
- 184 canonical/native agents
- 26 data guards
- 78 canonical routes, all `draft`
- 26 explicit sender mappings
- 20 physical source triggers

QA remains clean:

- 158/158 synthetic program events routed correctly
- 632/632 generated emails remained test-only/gated
- 26/26 DNC tests suppressed with zero email output
- 78/78 canonical routes remain draft
- 0 active non-draft canonical routes
- 26/26 cross-brand isolation checks passed
- 26/26 objection/handoff checks passed

## Activation State After Native Deployment

Current 158-program split:

- 70 `ready_for_internal_burnin`
- 65 `blocked_sender_identity`
- 12 `manual_only`
- 11 `blocked_audience_eligibility`
- 0 pipeline-infrastructure blockers
- 0 native-agent-infrastructure blockers

No unrestricted outbound or autonomous program is active.

### First 11 pilots

- STUSH: welcome, post_purchase, cart_recovery
- Good Times: reservations_experiences, user_acquisition, marketing_nurture
- MAGA Merchandise: welcome, post_purchase, cart_recovery
- Sole Exchange: impact_updates, volunteers

Audience verification:

- 11/11 receipts recorded
- eligible production contacts = 0
- pilot-ready = 0
- audience-gated = 11
- infrastructure blockers = 0

Audited source tables currently contain zero qualifying production rows. The gate is therefore real, not stale metadata.

## Sender Readiness — REMAINING EXTERNAL BLOCKER

12 entities still require production-verified dedicated sender identities:

- BARE
- Help 911
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

Corrections from the Claude audit:

- BARE: `bare-essentials.shop` was not verified owned; it returned NXDOMAIN. A real domain decision is required.
- Help 911: `help911.help` is owned/live but lacks completed mail configuration; verify/create mailbox, MX, SPF, DKIM, DMARC and controlled outbound send.
- No unverified `hello@...`/`info@...` address is treated as production-ready.

Tracked in GitHub Issue #9.

## ClickUp Execution Binding

Central destination:

- workspace `90141551653`
- space `90147280109`

BOH contains four staged enterprise execution actions. Current statuses:

- native deployment — completed before ClickUp write
- Claude/admin work — narrowed to 12 sender identities
- production burn-in — blocked by audience eligibility
- CRM→ClickUp execution binding — connector write blocked

ClickUp writes remain platform-rate-limited. No duplicate tasks are being created in entity boards.

## Security / Isolation

- New MCP CRM control-plane tables have RLS enabled with anon/auth access revoked.
- The older `crm_leads` table retains an intentional anon INSERT policy for lead intake; it is legacy intake behavior and was not altered during this control-plane hardening pass.
- Shared-credential HighLevel write runtimes remain quarantined with 410 responses and audit logging.
- Temporary deployment bridges are disabled after reconciliation.
- BOH `v_team_command_center` now uses `security_invoker=true`.
- BOH `team_command_pulse_updates_quarantine` now has RLS enabled and anon/auth access revoked.
- Broader legacy Supabase security debt remains a separate hardening stream; this document does not claim estate-wide security cleanliness.

## Known Exceptions — UNCHANGED

- STUSH canonical `2rlQ89TGyca6NZaFugHN`; duplicate `iMnrTkqOiutj7ayQMeFT` is unresolved and not merged.
- On Call canonical `TPGXRZ0h4ClKDbQFu5ew`; duplicate `TPyMj9PwUj9WRkAt4v0Y` is unresolved.
- MAGA Merchandise currently maps to `OR94o2hKNXj1tIopbmuw`; a separate location remains an architecture decision.
- Location `8dQDGCzUtKCVK9laectZ` remains excluded because of identity/blacklist mismatch.

## Immediate Remaining Actions

1. Complete and independently verify 12 dedicated sender identities.
2. Receive/populate legitimate production audiences and verify source, entity ownership, consent/lawful basis and suppression state.
3. Record positive audience receipts before pilot release.
4. Run only the 11-program controlled pilot cohort first.
5. Keep sensitive/restricted/manual programs human-gated.
6. Flush central ClickUp tasks when connector writes unlock.
7. Verify live source → Supabase → GHL → pipeline → owner/PM → messaging → ClickUp during burn-in.

## Beverage Scope

Not included: BEVCO INTL., Infinity Water, Pronto, ORA, XXX Vodka, Privè Vodka, Noir, Otini, Tempo, Casa Cantina, Island Water.

## Source Control

- Pipeline architecture: `ops/crm/ACTIVE_ENTITY_DEPARTMENT_CRM_MANIFEST_2026-09-03.md`
- Messaging deployment: `ops/crm/MESSAGING_OS_DEPLOYMENT_2026-09-03.md`
- Native deployment/burn-in runbook: `ops/crm/POST_SCOPE_NATIVE_DEPLOYMENT_RUNBOOK_2026-09-03.md`
- Sender completion: GitHub Issue #9
- Production burn-in / downstream work: GitHub Issue #10
