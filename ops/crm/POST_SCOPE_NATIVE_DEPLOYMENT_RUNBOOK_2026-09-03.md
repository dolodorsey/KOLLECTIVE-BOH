# Post-Scope Native CRM Deployment Runbook — 2026-09-03

## Purpose

This is the execution procedure for the 26 active non-beverage entities after the two missing HighLevel Private Integration permissions are added.

Do not use this runbook for beverage entities or excluded concert/event scopes.

The operating law is strict entity isolation. Every API call must use the exact entity/location PIT and exact location ID. Never substitute another brand's credential or location.

## Current Prerequisites

Already complete:

- 26 / 26 entity GHL locations mapped
- 26 / 26 exact per-location PITs validated for core CRM
- 260 / 260 CRM control fields provisioned
- 288 / 288 entity/core/program tags provisioned
- 599 canonical pipeline definitions complete
- 599 native pipeline deployment queue rows generated with exact location IDs and ordered stage payloads
- 184 canonical messaging agents complete
- 89 native agents already mirrored in `OFF` mode across 12 entities
- 95 native-agent rows waiting across 14 entities
- 78 canonical routes remain `draft`
- 0 autonomous programs

External permissions still required:

1. `pipelines.create` on all 26 entity Private Integrations.
2. Conversation AI agent-management permission on the 14 scope-blocked entity Private Integrations.

Editing permissions does not by itself authorize production activation.

## Phase 1 — Prove Permission, Do Not Guess

For each entity/capability, issue the existing deliberately invalid-body probe.

Record the result through:

`public.crm_record_ghl_scope_probe(entity_key, capability, http_status, response_excerpt, metadata)`

Accepted authorization proof:

- HTTP 400 or 422 only

Rejected / non-authorizing outcomes:

- 401 / 403 → scope blocked
- 404 → endpoint/route problem; do not authorize
- 5xx → provider problem; do not authorize
- 2xx → invalid probe behaved unexpectedly; do not authorize and investigate
- any other result → indeterminate; keep blocked

Never flip a scope flag manually because someone says the permission was changed in the UI. The endpoint probe is the deployment gate.

## Phase 2 — Pipeline Queue Release

Source tables:

- `public.crm_ghl_entity_runtime_map`
- `public.crm_ghl_pipeline_deployment_queue`
- `public.v_crm_ghl_pipeline_deployment_dashboard`
- `public.v_crm_ghl_scope_probe_status`

The scope-probe recorder releases pipeline queue rows only for the entity whose valid 400/422 probe was recorded.

Before any POST:

1. Confirm exact entity key.
2. Confirm exact GHL location ID from `crm_ghl_entity_runtime_map`.
3. Confirm credential strategy is `per_location_pit` and status is `pit_validated`.
4. Confirm queue row status is `queued`.
5. Check the live GHL location for an existing pipeline with the exact canonical name.
6. If exact name exists, store its native ID and mark `already_exists`; do not create a duplicate.
7. If not found, POST the row's `desired_payload` using that entity's exact PIT.
8. Store native pipeline ID, HTTP status, attempt count and timestamp.
9. On non-success, keep error details and do not silently retry forever.

Idempotency key is deterministic from exact location ID + canonical pipeline name.

## Phase 3 — Controlled Pipeline Waves

Never fire all 599 as one blind batch.

### Wave 1 — 195

Deploy first. Verify after the wave:

- exact-name uniqueness
- no cross-location creation
- stage names and order match canonical `stage_spec`
- no duplicate pipelines
- native IDs saved for every success/already-existing object
- zero open queue rows without an explicit status/error

Only proceed after Wave 1 is clean.

### Wave 2 — 147

Use the same checks.

### Wave 3 — 151

Use the same checks.

### Wave 4 — 106

Use the same checks.

Total: 599.

A failed entity does not justify using another entity's PIT. Isolate the failure and continue only where entity-local verification passes.

## Phase 4 — Mirror Remaining Conversation AI Agents

Scope-blocked entities:

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

After a valid Conversation AI permission probe, run the existing service-only function for the matching brand key:

`public.crm_mirror_ghl_brand_agents(brand_key)`

Expected remaining total: 95 native agents.

Hard verification after each brand:

- returned HighLevel agent IDs saved in Supabase
- native mode is `OFF`
- agent count equals expected count for that brand
- no cross-brand location mismatch
- no failed rows left labeled merely `pending`

Do not turn native agents ON as part of this phase.

## Phase 5 — Sender Gates

External messaging remains blocked for any fallback sender.

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

Source:

- `public.crm_sender_remediation_queue`
- `public.v_crm_sender_activation_gates`

Help 911 already has:

- owned domain `help911.help`
- recorded address `dialhelp911@gmail.com`
- planned `support@help911.help`
- planned `partners@help911.help`
- planned `claims@help911.help`

Those planned mailboxes must be created/connected and verified for SPF/DKIM/DMARC or equivalent provider authentication, reply routing and test-send behavior before sender-map activation.

For the other 11, resolve a real owned brand mailbox. Do not invent an address from a domain name.

## Phase 6 — Audience / Consent Gate

Infrastructure readiness is not marketing consent.

Before a real audience enters any outbound sequence:

- validate entity ownership of the contact
- validate contact source
- validate channel consent / lawful contact basis appropriate to the program
- honor DNC / STOP / unsubscribe / suppression state
- ensure the contact is not being pulled from another entity's database
- ensure sender/reply-to matches the same entity
- preserve source and campaign attribution

Any failure blocks that contact, not the guardrail.

## Phase 7 — First Controlled Burn-In

Initial candidate order:

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

Source:

- `public.crm_program_activation_plan`
- `public.v_crm_first_burnin_queue`

Burn-in rules:

- native agents remain `OFF`
- canonical routes remain `draft`
- human review remains required
- audience consent/eligibility is validated before real send
- small initial batch only; the activation control specifies maximum initial real batch where permitted
- DNC violations must remain 0
- cross-brand violations must remain 0
- unsafe claims must remain 0
- sender/reply behavior must pass
- every exception has a human owner

Do not broaden to the rest of the 158 programs merely because the first cohort works.

## Phase 8 — Programs That Stay Human-Gated

Infrastructure completion does not remove manual-control policy for:

- Help 911 sensitive service/client flows
- Mind Studio sensitive flows
- legal or medical/clinical scenarios
- crisis/emergency scenarios
- capital/investor communications
- custom contractual/financial terms
- high-value negotiations
- complaints/refunds requiring discretion
- unknown facts or requests that require approval

Never let an AI agent invent pricing, approval, contract terms, inventory, policy, outcome or guarantee.

## Phase 9 — ClickUp Execution Binding

Shared infrastructure actions belong in the central enterprise execution area, not entity boards.

Required central tasks:

1. `GHL | Add pipelines.create to 26 PITs`
2. `GHL | Add Conversation AI management scope to 14 PITs`
3. `CRM | Native pipeline + agent deployment after scopes`
4. `CRM | Production activation Wave 1`

A ClickUp connector write-rate limit was observed. Do not duplicate these tasks elsewhere just to bypass the platform limit.

## Executive Verification

Use:

`public.crm_activation_executive_summary()`

Current pre-remediation baseline:

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

Production readiness is achieved by reducing verified blockers through evidence, not by manually changing dashboard labels.

## Stop Conditions

Stop deployment immediately for the affected entity if any of these occur:

- credential/location mismatch
- cross-brand data or credential use
- duplicate native pipeline creation
- invalid probe returns an unexpected 2xx
- HighLevel 401/403 after claimed scope remediation
- agent created anywhere except the matching entity location
- native agent mode not OFF during build/burn-in
- sender identity cannot be verified
- suppression/DNC failure
- unexpected outbound send
- material legal/medical/safety escalation not routed to a human

Keep the entity blocked, log the exception and fix the root cause. Do not weaken the guardrail to make the status green.
