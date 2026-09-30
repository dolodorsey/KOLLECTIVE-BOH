# Target Universe Refresh — 2026-09-30

Canonical backend: **KOLLECTIVE BOH** Supabase (`wfkohcwxxsrhcxhepfql`)

## Purpose

Expand and preserve three isolated acquisition universes without overwriting existing account history:

1. VC / investor relations
2. Sponsor acquisition
3. Casper Group host-location acquisition

Account records remain separate from contact records. Existing touch history, active-wave state, routing state, and stop conditions must be preserved.

## VC / Investor

Canonical outreach lane:
- entity_key: `the-kollective`
- lane: `vc`

Current programmed universe:
- **2,179 investor / VC accounts**
- 56 legacy Gmail-attachment seed accounts
- 2,123 Google Drive-sourced accounts
- 74 decision-maker / route contact records currently attached

Primary Drive source:
- **VC Outreach Master**
- Drive file ID: `1VmmqpmWmXHifSXDOk_BZm2q13xVYCv1vzUp1LRUjYbc`
- MASTER tab source size: 2,387 firm rows before canonical matching/dedupe

Secondary research/enrichment source:
- **expanded_investor_database_500plus.html**
- Drive file ID: `1UHvRb0i6YhDejIlxUObiOt4i3UEoLVY4`

Rules:
- No bulk investor blast.
- Verify current thesis, current fund, and current investment decision-maker before first send.
- Preserve founder 1:1 outreach policy.
- Duplicate firms are matched at account level; people remain contacts under the firm.

## Sponsors

Canonical outreach lane:
- entity_key: `the-kollective`
- lane: `sponsor`

Current programmed universe:
- **517 sponsor accounts**
- 262 original Google Sheet accounts
- 255 Google Drive-sourced expansion accounts

Drive sources reviewed/merged:
- **DR. DORSEY - BRAND SPONSOR DATABASE**
  - Drive file ID: `13_WRR_tLsMguPLzOx1E7RxhwQPIolu2OXTngNRD25WY`
- **SPONSOR + LINKEDIN 2026B.xlsx**
  - Drive file ID: `1tFu_eAEqOoa-dVK1auSMNt9sCqv0eroW`
- **Sponsorship_Target_Companies_Outreach.xlsx**
  - Drive file ID: `1Qy18TyC9AnzsjeRXjV0C4OndMTy_TF4u`

Rules:
- `outreach_accounts` is the target-company universe.
- `growth_sponsor_opportunities` remains the deal/opportunity layer after a sponsor is matched to a specific entity/program and an ask is formed.
- Do not create a second company account because a source contains multiple people.
- Contact rotation remains separate under `outreach_account_contacts`.

## Casper Group — Host Locations

Canonical outreach lane:
- entity_key: `casper-group`
- lane: `casper_location`

Current programmed outreach universe:
- **1,358 location accounts**
- 30 remain in the existing active wave
- 1 duplicate audit record remains retained
- 1,327 are ranked reserves

Canonical venue registry:
- **1,368 total Casper venue records**
- **1,209 venue records** sourced from the new normalized Drive master

New canonical Drive source:
- **CASPER VENUE PROSPECTS — NORMALIZED.xlsx**
- Drive file ID: `1pDPW54DVQJ2ii_nTTdE8utrgQqOIKOLD`

Legacy source retained:
- **CASPER GROUP TARGETS.xlsx**

Rules:
- Existing 30-account active wave is not replaced by the import.
- New location accounts enter the reserve bench until wave capacity opens.
- Priority is based on kitchen-confidence signal, available business route, and local/independent ownership signal.
- Brianna routes to owner / GM / operations; Dr. Dorsey closes the economic deal.
- Keep source provenance and canonical/non-canonical status; do not silently delete duplicates.

## Data Model

Systems of record:
- `public.outreach_accounts` — target company / firm / location
- `public.outreach_account_contacts` — people and routes under an account
- `public.casper_venues` — Casper venue intelligence
- `public.casper_contacts` — Casper venue contacts
- `public.growth_sponsor_opportunities` — entity-specific sponsor deals, not the raw sponsor target universe

## Import Standard

All future list merges must:
1. Preserve existing activity and statuses.
2. Deduplicate at the account level before adding records.
3. Retain Drive source ID / provenance.
4. Put newly sourced unverified accounts into research/reserve states.
5. Keep people separate from company/location accounts.
6. Never turn a source-list presence into a qualified deal automatically.
