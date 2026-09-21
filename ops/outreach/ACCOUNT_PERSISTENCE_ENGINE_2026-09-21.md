# Account Persistence Outreach Engine

**Production date:** 2026-09-21  
**System of record:** KOLLECTIVE BOH / Supabase  
**Native scheduler:** pg_cron job `khg-outreach-persistence-sweep`  
**External sends:** approval/human gated

## Purpose

Outreach is managed at the **account/company level**, not as one disposable contact row.

A silent or wrong person never automatically kills a qualified company. The engine distinguishes:
- no reply → bounded follow-up on the same person, then rotate;
- wrong department / misrouted → rotate immediately;
- referral → add/follow the referral route;
- qualified decision-maker → book founder call;
- authorized explicit no → close the account;
- signed / approved → win and hand off.

QA verified:
1. wrong department switches immediately to the next ranked contact;
2. first and second no-reply outcomes stay on the same contact;
3. third no-reply rotates to the next contact;
4. QA transactions were rolled back and left no test data.

## Lanes

### Sponsors — The Kollective
- 262 sponsor accounts loaded.
- 265 known contacts loaded from the sponsor source workbook.
- Contact rotation: sponsorships/partnerships → experiential → brand marketing → field marketing → VP/CMO → agency/parent-company route.
- Stop only on qualified/authorized no, conflict, exhausted account routes, or DNC.
- No mass blast.

### VC — The Kollective
- Sender: `thedoctordorsey@gmail.com`.
- 56 firms seeded from the Gmail-native KHG investor source.
- 30 public firm routes are research-only.
- No VC send becomes ready until current thesis + current named partner + personal angle are verified.
- Gmail reply watch runs twice each weekday.
- No bulk campaign and no generic newsletter treatment.

### Casper Location Acquisition
- 148 unique canonical location accounts after source duplicate cleanup.
- Controlled pool: 30 active routes + 118 reserve.
- Brianna owns routing/call setup; Dr. Dorsey closes.
- Brianna receives one consolidated daily location-call task, not dozens of alerts.
- Starting operating assumption: backfill the 30-route pool on losses until 10 signed locations are reached; change this target when executive direction changes.
- Wrong department rotates immediately.
- Reserve accounts stay untouched until promoted.

### Casper Vendor Onboarding
Launch brands only:
- Angel Wings
- Patty Daddy
- Taco Yaki
- Espresso Co
- Mojo Juice

Required delivery platforms:
- DoorDash
- Uber Eats
- Grubhub

Required foodservice:
- one approved broadline provider; US Foods is the first target and alternates should advance immediately if service/terms do not fit.

**Completion rule:** contacted ≠ complete. A vendor task closes only when the account is approved and activation/ordering ready.

## Brianna Work Surface

Supabase view: `public.v_bri_casper_location_queue`

Daily task:
`Casper Location Call Block — <date>`

Vendor tasks:
- Casper Vendor Onboarding — DoorDash
- Casper Vendor Onboarding — Uber Eats
- Casper Vendor Onboarding — Grubhub
- Casper Vendor Onboarding — US Foods

## HighLevel Truth Rule

Affected Casper/Kollective pipeline manifests were corrected from `deployed` to `deployed_unverified`.

Observed at correction:
- Casper live GHL readiness: 20/100
- The Kollective live GHL readiness: 0/100
- pipelines_ready: false
- workflows_ready: false
- contacts_data_ready: false

Do not call a HighLevel lane deployed/verified until live readiness proves the actual pipeline, workflow, contact sync, and reporting requirements. The existing `ghl-entity-pipeline-deploy` job remains the deployment mechanism.

## Scheduler

The four descriptive `scheduled_operations` rows are event-driven records and do not feed unsupported tasks into the generic enterprise executor.

Actual router:
- pg_cron: `khg-outreach-persistence-sweep`
- cadence: hourly at minute 17
- function: `public.run_outreach_persistence_sweep()`

This sweep performs internal routing/tracking only. It does not authorize external messages, contracts, financial commitments, or mass sending.

## Data Objects

- `outreach_lane_policies`
- `outreach_accounts`
- `outreach_account_contacts`
- `outreach_activity`
- `outreach_threads`
- `casper_vendor_onboarding`
- `v_outreach_next_actions`
- `v_bri_casper_location_queue`
- `v_vc_founder_gmail_queue`

## Operator Standard

Every open opportunity needs:
- accountable owner;
- current contact route;
- next action;
- next-action timestamp;
- evidence/source;
- explicit stop condition.

No response is not a loss. Wrong person is not a loss. "We emailed them" is not completion.
