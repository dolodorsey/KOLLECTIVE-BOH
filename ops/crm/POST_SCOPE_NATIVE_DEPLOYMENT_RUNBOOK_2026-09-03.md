# Native CRM Deployment + Burn-In Runbook — 2026-09-03

## Purpose

The post-scope native deployment is complete. This runbook now defines the verified completed state and the remaining controlled production-burn-in procedure for the 26 active non-beverage entities.

Strict entity isolation remains law: exact entity/location PIT, exact location ID, entity-owned data and routing. Never substitute another entity's credential/location.

## Phase 0 — Native Deployment Baseline — COMPLETE

Verified complete:

- 26/26 GHL locations mapped
- 26/26 exact per-location PITs validated
- 26/26 `pipelines.create` authorized and proven
- 26/26 Conversation AI manage/write authorized and proven
- 260/260 CRM control fields provisioned
- 288/288 entity/core/program tags provisioned
- 599/599 native pipelines accounted for with GHL IDs
  - 598 created
  - 1 idempotent `already_exists` canary
  - 0 failures
- 184/184 native agents have GHL IDs
- 184/184 native agents remain `OFF`
- 78/78 canonical routes remain `draft`
- real outbound/autonomous activation = 0

Completed pipeline waves:

- Wave 1: 195/195
- Wave 2: 147/147
- Wave 3: 151/151
- Wave 4: 106/106

Do not rerun deployment merely because an old status file or dashboard still says blocked. Native IDs/receipts are the evidence source.

## Deployment Idempotency / Reconciliation Rules

For any future repair/reconciliation:

1. Confirm exact entity key and GHL location ID.
2. Confirm exact per-location PIT.
3. List existing native pipelines first.
4. Match by exact canonical name.
5. If exact name exists, retain/store its native ID; do not create a duplicate.
6. Never use another brand's PIT to recover a failed entity.
7. Never touch unresolved duplicate STUSH/On Call locations without explicit architecture approval.
8. Never activate agents as part of infrastructure repair.

Temporary cross-project deployment bridges used during the 599-pipeline rollout are disabled and must not be reactivated for ordinary operations.

## Phase 1 — Sender Gates

External messaging remains blocked for the following 12 until a real production sender is independently verified:

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

Sender-ready requires:

- verified owned domain
- real mailbox exists and is accessible
- MX configured
- SPF configured/verified
- DKIM configured/verified
- DMARC configured
- reply routing verified
- controlled outbound send verified

Known corrections:

- BARE: do not use `bare-essentials.shop` as a verified owned domain; Claude's audit found NXDOMAIN/unregistered state.
- Help 911: `help911.help` is owned/live, but mail configuration is not complete.
- Do not invent `hello@...`/`info@...` addresses.
- Do not use `vercel.app` aliases as mail domains.

Track completion in GitHub Issue #9 and `public.crm_sender_remediation_queue`.

## Phase 2 — Audience / Consent Gate

Infrastructure readiness is not contact eligibility.

Before any contact enters a live sequence:

- verify entity ownership/source
- verify lawful basis/channel consent appropriate to the program
- honor DNC, STOP, unsubscribe and suppression state
- prevent cross-brand database use
- verify sender/reply-to belongs to the same entity
- preserve source/campaign attribution

Record evidence in `public.crm_program_audience_receipts`.

A zero-eligible receipt is a valid blocker and must not be overridden merely to start a pilot.

## Phase 3 — First Controlled Burn-In

Initial 11 candidate programs:

1. STUSH — welcome
2. STUSH — post_purchase
3. STUSH — cart_recovery
4. Good Times — reservations_experiences
5. Good Times — user_acquisition
6. Good Times — marketing_nurture
7. MAGA Merchandise — welcome
8. MAGA Merchandise — post_purchase
9. MAGA Merchandise — cart_recovery
10. Sole Exchange — impact_updates
11. Sole Exchange — volunteers

Current verified audience state:

- 11/11 audience receipts recorded
- eligible audience = 0
- pilot-ready = 0
- audience-gated = 11
- infrastructure blockers = 0

Do not create fake audiences to make the gate green.

When legitimate eligible audiences exist, burn-in rules are:

- native agents remain `OFF`
- canonical routes remain `draft`
- human review required
- start with a small controlled batch
- DNC/STOP violations = 0
- cross-brand violations = 0
- unsafe/invented claims = 0
- sender/reply behavior must pass
- every exception has a human owner

Only after the first cohort is verified should broader activation be considered.

## Phase 4 — Programs That Stay Human-Gated

Do not auto-activate:

- Help 911 sensitive service/client flows
- Mind Studio sensitive flows
- legal/medical/clinical/crisis scenarios
- capital/investor communications
- custom contractual/financial terms
- high-value negotiations
- complaints/refunds requiring judgment
- unknown facts requiring approval

AI must never invent pricing, approvals, contracts, inventory, policies, outcomes or guarantees.

## Phase 5 — ClickUp Execution Binding

Central enterprise destination:

- workspace `90141551653`
- space `90147280109`

Four enterprise actions are staged in BOH. Native deployment is already marked complete. Sender work and burn-in remain current. ClickUp write endpoints are platform-rate-limited, so do not duplicate tasks into entity workspaces to bypass the limit.

Once writes unlock:

1. create/use the central Enterprise Systems CRM/GHL/Messaging OS list
2. flush only the staged real actions
3. mark native-deployment action completed rather than creating redundant work
4. preserve entity-specific operational execution in each entity's own workspace/space

## Phase 6 — End-to-End Burn-In Verification

For every live pilot path verify:

`source → Supabase → correct entity → correct GHL subaccount → correct native pipeline/stage → owner/PM → messaging decision → ClickUp handoff where applicable`

Verify:

- exact entity mapping
- correct native pipeline ID
- correct owner and PM
- sender identity
- consent/suppression state
- agent remains OFF unless a later separately approved activation occurs
- route remains controlled
- attribution retained
- no cross-brand access

## Current Activation Matrix

Across 158 programs:

- 70 `ready_for_internal_burnin`
- 65 `blocked_sender_identity`
- 12 `manual_only`
- 11 `blocked_audience_eligibility`
- 0 pipeline-infrastructure blockers
- 0 native-agent-infrastructure blockers

No unrestricted external outbound or autonomous program is active.

## Stop Conditions

Stop the affected entity/program if any of these occur:

- credential/location mismatch
- cross-brand data/credential use
- duplicate native pipeline creation
- agent appears outside matching entity location
- native agent mode changes from OFF during build/burn-in without explicit approval
- sender identity cannot be verified
- DNC/suppression failure
- unexpected outbound send
- material legal/medical/safety escalation not routed to a human
- production audience lacks verified eligibility evidence

Fix the root cause; do not weaken the gate.

## Known Architecture Exceptions

- STUSH canonical `2rlQ89TGyca6NZaFugHN`; duplicate `iMnrTkqOiutj7ayQMeFT` untouched.
- On Call canonical `TPGXRZ0h4ClKDbQFu5ew`; duplicate `TPyMj9PwUj9WRkAt4v0Y` untouched.
- MAGA Merchandise remains mapped to `OR94o2hKNXj1tIopbmuw` pending any future dedicated-location decision.
- `8dQDGCzUtKCVK9laectZ` remains excluded because of identity/blacklist mismatch.

## Beverage Scope

Not included in this runbook: BEVCO INTL., Infinity Water, Pronto, ORA, XXX Vodka, Privè Vodka, Noir, Otini, Tempo, Casa Cantina, Island Water.
