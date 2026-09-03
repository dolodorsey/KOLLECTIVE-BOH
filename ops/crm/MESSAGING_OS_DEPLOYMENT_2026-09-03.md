# Messaging OS Deployment — 2026-09-03

## Scope

This deployment record covers the 26 active non-beverage entities in the current CRM/Messaging OS scope. Beverage entities remain intentionally excluded from this pass.

The operating rule is strict entity isolation: every entity owns its own messaging programs, sender identity, conversation router, specialist agents, data guard, channel routes, pipeline bindings, source triggers, CRM records, and native HighLevel objects where an exact entity/location credential is available.

## Canonical Messaging OS State

- 26 active brand profiles
- 158 entity-specific messaging programs
- 632 preprogrammed email sequence steps (4 per program)
- 184 active canonical conversation agents
  - 158 specialist agents
  - 26 entity conversation routers
- 26 entity data guards in the managed-agent registry
- 78 active channel routes: email + SMS + Instagram for every entity
- 32 Wave 1 CRM pipeline-to-messaging bindings
- 20 live source-table/event triggers
- 26 explicit entity sender mappings

All canonical routes are `draft` gated. No canonical route is active in an autonomous mode.

## Messaging Program Model

Every program is independently owned by one entity and one business purpose. Examples include customer/user acquisition, sponsor outreach, ambassador recruitment, service-provider recruitment, partnerships, B2B sales, vendor outreach, cart recovery, booking/intake, lifecycle nurture, reactivation, media/PR, reviews/referrals, consultation, speaking, bulk sales, distribution, community, and support.

Inbound routing follows:

`entity channel -> entity router -> intent -> entity specialist -> data guard -> CRM/pipeline action -> human escalation when required`

Outbound lifecycle follows:

`source event -> entity/program classification -> consent/suppression check -> entity sender -> four-step sequence -> QA/send gate`

Cross-brand routing, cross-brand sender fallback, and cross-brand conversation context are prohibited.

## Verified QA Results

### Program/Event Simulation

A synthetic event was created for every ready messaging program and then removed after validation.

- 158 / 158 program events routed to the correct specialist agent
- 158 / 158 selected the correct email-sequence family
- 158 / 158 remained in `draft_qa`
- 0 unsafe dispatch statuses
- 632 / 632 generated email steps remained `test_only`
- 632 / 632 had `gate_allowed = false`
- 0 synthetic emails were sent

### DNC / Suppression Simulation

One opted-out synthetic event was tested for each active entity.

- 26 / 26 correctly suppressed
- 26 / 26 marked consent blocked
- 26 / 26 marked suppression blocked
- 0 emails created for suppressed contacts

### Route / Isolation QA

- 78 / 78 required channel routes are active
- 78 / 78 are `draft`
- 0 active non-draft canonical routes
- 26 / 26 entity cross-brand isolation checks passed
- 26 / 26 objection/handoff checks passed
- 78 / 78 routes include cross-brand escalation
- 78 / 78 include custom-terms escalation
- 78 / 78 include complaint escalation
- 78 / 78 include legal/medical/emergency escalation safeguards
- 158 / 158 programs include STOP guardrails
- 158 / 158 programs include UNSUBSCRIBE guardrails

### Agent Inventory QA

- 184 expected active canonical agents
- 184 actual active canonical agents
- 0 unexpected active agents
- 0 missing expected agents

The QA results are persisted in `public.crm_messaging_qa_log`; synthetic dispatch/email records were removed after validation.

## Legacy Messaging Cleanup

The new architecture found and neutralized legacy messaging behavior that could compete with the canonical entity-owned system.

- 21 legacy duplicate/unsafe conversation routes were changed to `blocked` and retained only for audit/recovery.
- One legacy `STUSH__CONVERSATIONS` agent was disabled.
- Previously discovered unrelated native HighLevel agents were moved to OFF mode rather than deleted, including unrelated Dr. Dorsey/Consultations/Washington Parq agents under The Kollective and a Lemon Pepper Lou's agent under The People's Dept.

No legacy route is allowed to override the canonical draft-gated entity router.

## Native HighLevel Conversation AI

Native HighLevel Conversation AI objects are mirrored only when the exact entity/location PIT is available from the current Supabase credential stores. Supabase remains the canonical control plane.

### Credential-ready and mirrored

89 new native HighLevel agents are deployed in `OFF` mode across 12 entities:

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

All returned HighLevel native agent IDs are mirrored back into Supabase. Native agents remain `OFF`; they are not permitted to answer autonomously yet.

### HighLevel location exists but exact current PIT is not available in the active credential mirrors

These locations are real/mapped, but no exact current per-location PIT was found across the active/current Supabase GHL credential stores. Legacy/deactivated credentials are not reused across entities or locations.

- BARE — `GrP82FcIfLmZZYM4CLo1`
- Clean Cut — `PNGsYICyiZcRQIfwbXVD`
- Frequency Productions — `Zm9L9yJnfEqIyUNlMmRh`
- Hakuna Matata — `my3t8XWT680gA5UWpoda`
- Halloween General — `Xl00ZeWTpZmay17o74Sw`
- Mission 365 — `k0qCyTaLEJaIazRML7hs`
- Synergy Sounds — `vHT7U9MIunt8Tl13nurI`
- Umbrella Auto Exchange — `dBHdPA05U62NuOD4K5oo`

Mission 365's own Supabase project vault was also checked and does not currently contain a HighLevel PIT.

### No native location mapping yet

- Bodega
- Brand Studio
- Consultations
- Courses
- Halloween Women
- Halloween Sexy Women

These entities remain fully represented in the Supabase Messaging OS and are not merged into another entity/location for convenience.

## HighLevel Credential Architecture — Corrected

The prior agency-token assumption is retired.

**Actual architecture:** exact per-location HighLevel PIT credentials stored in Supabase and used only for their matching GHL location/entity.

Rules:

1. No agency-wide credential is required or assumed.
2. Never cross-use one entity/location PIT for another entity.
3. Never reactivate legacy credentials merely because their name resembles a current brand.
4. Legacy GHL credentials deactivated on 2026-07-28 remain deactivated unless separately validated against the exact current location.
5. A location becomes native-ready only when its exact PIT is present in the current credential path.
6. Once ready, run `public.crm_mirror_ghl_brand_agents(brand_key)` to create entity-owned native agents in OFF mode and store returned IDs in Supabase.

## Security / Data Handling

All `public.crm_messaging_%` control tables have RLS enabled and are operated as internal/service control tables. Messaging dispatch records store routing/contact metadata rather than duplicating full sensitive intake records.

Help 911 and Mind Studio retain stricter human-gating and escalation behavior for legal, medical, clinical, emergency, or other high-risk conversations.

## Activation Policy

No entity's messaging system moves from draft/OFF into live autonomous operation until all of the following are verified for that entity:

- correct sender/reply-to identity
- consent and suppression behavior
- cross-brand isolation
- program-specific conversation simulations
- objection and escalation behavior
- pipeline/source trigger correctness
- human owner/escalation route
- native GHL mapping and exact PIT where native Conversation AI is used
- approval by the responsible operating owner/PM

Low-risk programs may later move from OFF/draft to suggestive or controlled automation after QA. High-risk, contractual, legal, medical, clinical, capital, complaint, refund, custom-terms, and unknown-fact conversations remain human-gated.

## Beverage Scope

The following are explicitly not part of this 26-entity deployment pass: BEVCO INTL., Infinity Water, Pronto, ORA, XXX Vodka, Privè Vodka, Noir, Otini, Tempo, Casa Cantina, and Island Water.
