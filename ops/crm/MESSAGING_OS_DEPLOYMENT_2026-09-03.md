# Messaging OS Deployment — 2026-09-03

## Scope

This record covers the 26 active non-beverage entities. Beverages remain excluded. Strict entity isolation remains mandatory: exact entity GHL location, exact per-location PIT, entity-owned CRM/pipelines/agents/routes/data/senders. No shared or agency credential is used for entity writes.

## Final Native Infrastructure State — VERIFIED COMPLETE

### GHL / credentials

- 26/26 entities have exact mapped HighLevel locations.
- 26/26 have exact per-location PITs in Supabase.
- 26/26 `pipelines.create` permissions independently verified with invalid-body HTTP 422 probes and subsequently proven by native writes.
- 26/26 Conversation AI manage/write permissions independently verified with invalid-body HTTP 422 probes and subsequently proven by native writes.
- 260/260 common CRM opportunity fields provisioned.
- 288/288 entity/core/program tags provisioned.

### Native pipelines

Canonical BOH manifest: **599 pipelines**.

Deployment result:

- 599/599 accounted for with native GHL pipeline IDs
- 598 newly created
- 1 `already_exists` idempotent canary
- 0 failures

Waves completed:

- Wave 1: 195/195
- Wave 2: 147/147
- Wave 3: 151/151
- Wave 4: 106/106

Every pipeline retained exact-location locking and canonical stage order. Canonical STUSH and On Call locations were used; duplicate locations were not touched.

### Native Conversation AI

- 184/184 canonical agents have native GHL IDs.
- 184/184 native agents remain `OFF`.
- 0 missing native IDs.
- 0 non-OFF native agents.

No native agent was activated merely because infrastructure completed.

## Canonical Messaging OS

Verified architecture:

- 26 active brand profiles
- 158 entity-specific messaging programs
- 632 email sequence steps
- 158 specialist agents + 26 entity routers = 184 canonical/native agents
- 26 data guards
- 78 canonical channel routes (email/SMS/Instagram), all `draft`
- 32 Wave 1 pipeline-to-messaging bindings
- 20 physical source triggers
- 26 explicit sender mappings

Existing QA remains clean:

- 158/158 synthetic program events routed correctly
- 632/632 synthetic email steps stayed test-only/gated
- 26/26 DNC simulations suppressed with zero email output
- 78/78 canonical routes remain draft
- 0 active non-draft canonical routes
- 26/26 cross-brand isolation checks passed
- 26/26 objection/handoff checks passed

Real outbound/autonomous activation from this control plane remains **0**.

## Activation Control — CURRENT

After native-infrastructure reconciliation, the 158 programs classify as:

- 70 `ready_for_internal_burnin`
- 65 `blocked_sender_identity`
- 12 `manual_only`
- 11 `blocked_audience_eligibility`
- 0 pipeline-infrastructure blockers
- 0 native-agent-infrastructure blockers

`ready_for_internal_burnin` is an internal readiness state, not permission for unrestricted external sending.

### First 11 controlled pilot candidates

- STUSH: welcome, post_purchase, cart_recovery
- Good Times: reservations_experiences, user_acquisition, marketing_nurture
- MAGA Merchandise: welcome, post_purchase, cart_recovery
- Sole Exchange: impact_updates, volunteers

Production-audience audit result:

- 11/11 audience receipts recorded
- eligible production audience = 0
- pilot-ready = 0
- audience-gated = 11
- infrastructure blockers = 0

Audited production source tables currently contain zero qualifying rows for these pilot paths. No test/fake contacts were promoted to live audiences.

## Sender Readiness — 12 REMAIN BLOCKED

The following still require dedicated production sender identity completion:

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

Important corrections:

- `bare-essentials.shop` is not a verified owned domain; Claude's audit found NXDOMAIN/unregistered state. BARE needs a real domain decision first.
- `help911.help` is owned/live but mail configuration is incomplete; mailbox/MX/SPF/DKIM/DMARC and controlled-send verification are still required.
- `email_mailboxes` had zero confirmed mailbox rows for all 12 at the Claude audit.

Do not invent `hello@...` / `info@...` addresses, and do not use `vercel.app` aliases as email domains.

Sender work is tracked in GitHub Issue #9.

## Human-Gated Programs

Infrastructure completion does not remove manual controls for:

- Help 911 sensitive client/service flows
- Mind Studio sensitive flows
- legal/medical/clinical/crisis topics
- capital/investor communications
- custom contractual/financial terms
- high-value negotiations
- complaints/refunds requiring discretion
- unknown facts requiring approval

## ClickUp

Central enterprise destination is verified:

- workspace `90141551653`
- space `90147280109`

Four central actions are staged in BOH. Native deployment is marked completed there. ClickUp connector writes remain platform-rate-limited, so duplicate tasks are not being created in entity boards.

## Security / Isolation

- New MCP CRM/messaging control tables use RLS and service-only access; anon/authenticated access is revoked.
- Shared-credential HighLevel write runtimes remain quarantined; stale write calls return 410 and are audited.
- Temporary pipeline deployment bridges are disabled after the 599-pipeline reconciliation.
- BOH `v_team_command_center` was hardened with `security_invoker=true`.
- BOH `team_command_pulse_updates_quarantine` has RLS enabled; anon/auth access revoked; service-role access retained.
- Legacy project-wide security debt remains separate; this record does not claim the entire Supabase estate is security-clean.

## Known Architecture Exceptions — UNTOUCHED

- STUSH canonical: `2rlQ89TGyca6NZaFugHN`; duplicate `iMnrTkqOiutj7ayQMeFT` remains unresolved and must not be auto-merged.
- On Call canonical: `TPGXRZ0h4ClKDbQFu5ew`; duplicate `TPyMj9PwUj9WRkAt4v0Y` remains unresolved.
- MAGA Merchandise currently maps to `OR94o2hKNXj1tIopbmuw`; dedicated-location separation remains a future architecture decision.
- `8dQDGCzUtKCVK9laectZ` has an identity mismatch/blacklisted-party issue and must not receive Kollective traffic.

## Remaining Production Gates

1. Complete and independently verify the 12 dedicated sender identities.
2. Receive/populate legitimate production audiences and validate consent/lawful basis, suppression and entity ownership.
3. Record positive audience receipts before pilot release.
4. Run the 11 low-risk pilots in controlled batches only after all gates pass.
5. Keep restricted/manual programs human-controlled.
6. Flush central execution actions into ClickUp once write access unlocks.
7. During burn-in verify source → Supabase → GHL → pipeline → owner/PM → messaging → ClickUp end-to-end.

## Beverage Scope

Not included: BEVCO INTL., Infinity Water, Pronto, ORA, XXX Vodka, Privè Vodka, Noir, Otini, Tempo, Casa Cantina, Island Water.

Production burn-in and remaining blockers are tracked in GitHub Issue #10.
