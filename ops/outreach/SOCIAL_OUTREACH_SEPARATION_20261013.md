# SOCIAL OUTREACH — SEPARATE EXECUTION DIVISION (2026-10-13)

Canonical KOLLECTIVE BOH: `wfkohcwxxsrhcxhepfql`.
Live BOH bridge v38: read-only allowlist for three social worklist views.
Front-end PR: dedicated `/social-outreach` route in `khg-dashboard`, distinct from `/inner-circle-outreach` and the general publishing calendar.

## Scope
- Instagram/social engagement: save and qualify targets with platform, intent, next eligibility date and verified provider action receipts.
- Ambassadors/influencers: candidate stage, terms, audience/compliance verification, approved outreach and attribution. Drafts != sent.
- LinkedIn: independent Dorsey/Kollective executive initiatives, research and relationship development, platform-specific permission and appropriate cadence.
- Provider proof: distinguish posting from real engagement and replies. 65 social receipt records were publishing actions, NOT proof of social engagements at audit.
- Independently track each brand via `enterprise_entity_id` and `entity_key` without mixing sender identity, data, approval, or metrics.

## Read-only views
- `v_khg_social_engagement_outreach_v1`
- `v_khg_social_ambassador_outreach_v1`
- `v_khg_social_proof_receipts_v1`
All views are `security_invoker=on`, service role SELECT only. No sending exposed.

## Verified October 13 source counts
- 1,608 social engagement targets (1,583 Instagram; 25 LinkedIn).
- 448 ambassador members.
- 251 ambassador outreach events (225 draft, 26 cancelled; no provider send receipts established in this stream).
- 65 social execution receipts, all Instagram publishing operations, not engagement receipts.
- LinkedIn 25 targets assigned to the Dr. Dorsey entity.

## Safety and authority
- @DOLODORSEY direct messages remain founder-manual only.
- Every engagement reply or outreach action needs exact brand approval, no DNC/opt-out violation, legitimate context, and provider evidence.
- Social and ambassador contact work should not inherit venue-call follow-up schedules or founder-sales statuses.
- No source spreadsheet copied into live queues based on a 71-tab recovery workbook: individual queue tabs are templates and may have no targets.

## Exit gate for production deployment
- Latest GitHub PR branch compiles and Vercel preview is READY.
- Owner-only access tested; no personal data leaks in unauthenticated requests.
- Desktop and mobile actual rendered snapshots reviewed for all four tabs.
- Verify entity filters and LinkedIn-only view; no automatically sent external messages.
- Preserve social publisher and ambassadors dashboards as separate, functioning resources.
