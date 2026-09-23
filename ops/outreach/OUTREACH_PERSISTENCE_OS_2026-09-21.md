# Outreach Persistence OS — 2026-09-21

Canonical backend: **KOLLECTIVE BOH** Supabase (`wfkohcwxxsrhcxhepfql`)

## Purpose

Run four isolated acquisition lanes without allowing one failed contact to kill a qualified account:

1. Sponsor acquisition
2. VC / investor relations
3. Casper Group host-location acquisition
4. Casper Group required vendor onboarding

The system separates **account state** from **contact state**. A person can fail, be misrouted, leave the company, or ignore outreach while the company/location/firm remains active.

## Global rules

- Never close an account because one contact did not reply.
- `wrong_department` / `misrouted` => switch contact immediately.
- `no_reply` => bounded follow-up on that person, then rotate.
- `explicit_no` only closes the account when the contact is an authorized/correct decision-maker.
- All external sends, contracts, legal commitments, financial commitments and material terms remain human/policy gated.
- Internal routing, due-state calculation, reserve promotion and next-action maintenance are deterministic.
- Evidence and source provenance are retained; duplicates are deactivated/non-canonical rather than silently deleted.

## Lane: Sponsors

System of record:
- `public.outreach_accounts` — company/account
- `public.outreach_account_contacts` — people/routes under company
- `public.outreach_activity`
- `public.outreach_threads`
- `public.outreach_lane_policies`

Current source: DR. DORSEY - BRAND SPONSOR DATABASE Google Sheet.

Loaded at implementation:
- 262 sponsor accounts
- 265 known sponsor contacts

Contact ladder:
1. Partnerships / Sponsorships
2. Experiential
3. Brand Marketing
4. Field Marketing
5. VP Marketing / CMO
6. Agency
7. Parent-company partnerships

Default contact policy:
- maximum 3 touches per person
- 72-hour follow-up delay
- rotate when route is stale / exhausted
- company stays active unless an authorized decision-maker says no, category conflict is confirmed, budget is unavailable after qualified discussion, all routes are exhausted, or DNC applies

## Lane: VC

Primary outbound channel: **founder 1:1 Gmail from `thedoctordorsey@gmail.com`**

Rules:
- no bulk blast
- no newsletter-style outreach
- no identical mass copy
- one investor / one thread / one personalized thesis angle
- verify current fund, current thesis and current partner before first send
- stale public investor mappings are research seeds only
- public firm inboxes are research/routing aids, not approved first-send destinations unless explicitly chosen
- same-thread follow-ups only
- first external send remains founder-approved

Current source seed:
- Gmail message: “KHG Investor List — 351 names, 23 live pitch routes”
- 56 firms loaded as research accounts
- 30 public firm email/application routes loaded as research-only contacts
- source message labeled `VC / SOURCE`

VC CRM stages already present:
Fund / Partner Target -> Thesis Fit -> Warm Path Researched -> Outreach Drafted -> Approval -> Sent / Intro -> Replied -> Partner Meeting -> Follow-up -> Controlled Data Room / Diligence -> Term Sheet / Financing Docs -> Funds Verified / Passed / Nurture

## Lane: Casper Group — Host Locations

Owner/operator workflow:
- **Brianna:** route to owner / GM / operations, capture direct contact, book Dr. Dorsey
- **Dr. Dorsey:** close economic/business deal
- next sequence: founder call -> NDA/deal review -> site walk -> signed host agreement -> launch readiness

Canonical launch brands only:
- Angel Wings
- Patty Daddy
- Taco Yaki
- Espresso Co
- Mojo Juice

Source: `CASPER GROUP TARGETS.xlsx`

Input contained 150 source rows. Canonicalized result:
- 148 unique active location accounts
- 148 active accounts with a current contact/management route
- duplicate source rows retained for audit but marked non-canonical/inactive

Controlled-wave policy:
- 20 live acquisition accounts at a time
- remaining qualified locations remain ranked reserves
- reserve accounts are automatically promoted as live routes close/exhaust
- keeping a reserve bench is intentional; the goal is to avoid a launch being blocked by insufficient location supply

## Lane: Casper Group — Vendors

Brianna owns **completion**, not outreach activity.

Required delivery platforms:
- DoorDash
- Uber Eats
- Grubhub

Foodservice:
- one broadline provider required
- US Foods seeded as primary target; switch to an alternate if unavailable/unsuitable

Completion = approved / activation-ready account with requirements satisfied.
“Contacted,” “emailed,” “application started,” or “waiting for reply” are not completion.

Vendor tracker:
- `public.casper_vendor_onboarding`

## Deterministic runtime

Private runtime:
- `private.run_outreach_persistence_router()`
- `private.replenish_casper_location_wave(integer)`

Cron:
- `khg-outreach-persistence-router`
- schedule: `42 * * * *`
- purpose: internal routing / wave maintenance / next-action maintenance only

Control-plane schedule records:
- `outreach_persistence:sponsors`
- `outreach_persistence:vc_gmail`
- `outreach_persistence:casper_locations`
- `outreach_persistence:casper_vendors`

These records remain active for operational visibility, but the actual persistence router is the private database Cron function. This avoids dependence on the currently degraded LLM reasoning worker.

## Core Supabase objects added

Tables:
- `public.outreach_lane_policies`
- `public.outreach_accounts`
- `public.outreach_account_contacts`
- `public.outreach_activity`
- `public.outreach_threads`
- `public.casper_vendor_onboarding`

Function:
- `public.outreach_select_next_contact(uuid)`
- `public.outreach_record_outcome(...)`

View:
- `public.v_outreach_next_actions`

RLS is enabled on all new public tables. Direct `anon` / `authenticated` access is revoked; service-side workflows are the intended execution path.

## HighLevel truth — superseded 2026-09-23

Do not treat CRM manifest status as live proof, and do not treat the ChatGPT-facing HighLevel connector IAM state as GHL runtime health.

**Authoritative runtime:** Supabase-backed GHL credentials and entity/location mappings. The agency credential was validated on 2026-09-23 against the live agency inventory (97 locations). Each lane must still prove its exact location, sender, pipeline/workflow state, contacts, delivery and provider receipts independently.

**Default outbound:** GHL for marketing email, newsletters, nurture, provider recruitment, customer lifecycle, operational follow-up and SMS. Entity data, locations, senders, workflows and reporting remain fully separated.

**Exception:** VC / investor relations continues to use founder 1:1 Gmail from `thedoctordorsey@gmail.com`; GHL supports CRM/tracking for that lane. Founder-personal or another explicitly approved special case may also use Gmail. There is no automatic marketing fallback from GHL to Gmail.

Relevant pipeline manifests remain QA-gated until their exact entity objects are verified live.

## Event outcomes

Use `public.outreach_record_outcome` to record routing decisions.

Important outcomes:
- `wrong_department`
- `misrouted`
- `referred`
- `no_reply`
- `replied`
- `correct_decision_maker`
- `meeting_booked`
- `explicit_no`
- `signed`
- `approved`

## QA standard

An outreach lane is not complete because:
- a list exists
- one email was sent
- a pipeline name exists
- a vendor was contacted
- an agent exists
- GHL says an object was planned

Completion requires:
- correct account/contact routing
- next action + deadline
- source evidence
- communication evidence / provider receipt when sent
- bounded retry + contact rotation
- explicit stop condition
- handoff to responsible closer
- live GHL verification when GHL is part of the lane
- activation-ready vendor status for required Casper vendors
