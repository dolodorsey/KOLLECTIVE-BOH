# INNER CIRCLE OUTREACH — EMAIL-FIRST FOUNDER BOOKING (2026-10-13)

## Canonical assets and execution state
- Supabase KOLLECTIVE BOH project: `wfkohcwxxsrhcxhepfql`.
- Production-restricted `dashboard-boh-bridge` function v35: read-only allowlisted worklists + owner-authorized manual note RPC.
- UI feature: `dolodorsey/khg-dashboard`, PR #213 (draft review gate). Proposed path: `/inner-circle-outreach`.
- Existing `/marketing/outreach` and `/outreach-command` are retained unchanged.
- External sends and dialing are NOT enabled. No automatic email, calls, DM, SMS or founder calendar invite is created here.
- Original Google Drive workbooks are reference-only; not CRM write targets.
- Legacy `partnership_outreach` contains 20 GOOD TIMES and 4 INNER CIRCLE accounts. The new dashboard strictly pins this visible lane to GOOD TIMES entity_key to prevent mixed-brand display. Inner Circle's four legacy entries remain preserved; handle them in their own entity-scoped route during follow-up, never relabel as GOOD TIMES.
- NTF is assigned the distinct provisional `ntf` brand key. No matching NTF record currently exists in `enterprise_directory_records`, so registration and verified sender/CRM binding remain blocked; do not borrow The Kollective identity.
- Source-of-truth activity events: `public.outreach_activity`; accounts: `public.outreach_accounts`; POCs: `public.outreach_account_contacts`; manual call assignments: `public.outreach_call_queue`.
- All original Outreach lane policies remained paused during provisioning.

## Operational priority
1. Venue partner account qualification.
2. Verify current role and POC; email first when consent/sender/approval gates permit.
3. Record provider receipt, response, rejection, bounce or no-reply without inventing any send.
4. Refer/escalate the contact if needed; persist the previous contact and add the higher POC as a separate linked record.
5. Phone list only for justified escalation, requested callback, or existing approved assignments.
6. Founder booking only after date and calendar evidence; meeting confirmation is not equal to a draft or tentative acceptance.
7. Retain detailed notes and timestamped next action on every account.

## Separate brands and outreach lanes
| Lane | Independent brand | Purpose |
| --- | --- | --- |
| inner_circle_venue | INNER CIRCLE | Venue access and bundling |
| memory_machine_venue | MEMORY MACHINE | Sponsored photo booth placements |
| good_times_venue / partnership_outreach | GOOD TIMES | In-app venue partnerships |
| bevco_venue_placement | BEVCO | On-premise beverage placement |
| casper_location | CASPER GROUP | Idle kitchen venue deals |
| casper_school_stadium | CASPER GROUP | Public school/stadium authority path; email/procurement-first |
| mister_venue_merch | MISTER MANUFACTURING | Merchandise production |
| sole_exchange_venue | SOLE EXCHANGE | Donation/venue activations |
| ntf_venue_partner | NTF | Venue and track partnerships |
| sponsor | KOLLECTIVE | Corporate brands and sponsorships |
| vc / bank_financing | KOLLECTIVE | Founder-led investor and banking conversations |
| bevco_distribution | BEVCO | Beverage distributors and wholesalers |
| casper_vendor | CASPER GROUP | Food-service suppliers / vendor setup |
| casper_delivery | CASPER GROUP | Delivery-platform integrations |

Each lane uses its own legal sender identity, contact permission, account history, qualification and owner. An account belonging to two opportunities should have separate brand-scoped records linked via a safe account identity when supported, not share another brand's contact/send history.

## Database schema introduced
- `outreach_disposition_catalog`: 36 explicitly coded outcomes with next-step recommendations.
- `outreach_activity`: added disposition, followup deadline, referred contact, founder meeting, evidence columns.
- `outreach_account_contacts`: added referred title/phone, primary POC, verified_at and preferred_channel.
- Read-only, security-invoker views:
  - `v_inner_circle_outreach_email_worklist_v1`
  - `v_inner_circle_outreach_call_worklist_v1`
  - `v_inner_circle_outreach_poc_directory_v1`
  - `v_inner_circle_outreach_recent_activity_v1`
  - `v_inner_circle_outreach_lane_summary_v1`
- Server-initiated, service-role-only, security-invoker RPCs:
  - `outreach_staff_note_v1` — mandatory notes, evidence gates, optional new POC, follow-up.
  - `outreach_log_call_note_v1` — durable phone disposition and same call-task readback.
- POC referrals are created in verification-pending state. They never silently replace the current verified decision maker.
- `provider_sent` requires a provider message receipt. `meeting_booked` requires founder meeting date and calendar evidence. DNC events halt account outreach.
- New database lane definitions are provisioned inactive; all existing lane policy flags were unchanged.

## Operator status/QA
A stored target is not a sent email. A draft is not delivered. A queued call is not a completed call. A provisional date is not a booked meeting. Booking is not revenue. Every claim requires exact proof.

### Mandatory production release checks
1. Preview build succeeds for exact `khg-dashboard` PR commit; no regression to existing routes.
2. Confirm owner-only access and rejected anonymous requests.
3. Desktop/mobile screenshot review of the new screen.
4. Verify email list, call list, POC directory and activity history display counts matching Supabase.
5. Safe manual note+referral test that does not send anything; no live prospect message.
6. Verify no duplicate contact creation, correct POC ownership, DNC lock, receipt and meeting evidence requirements.
7. Confirm all lane flags remain paused and no outbound workflow is triggered.
8. Only merge and production-deploy after these checks.

## Social Outreach separation
Social engagement, ambassadors, influencers, LinkedIn initiatives, and replies belong to a distinct Social Outreach division. The 71-tab October 6 Social recovery workbook is a reference/template, not evidence of engagement execution. Maintain brand-owned social streams, provider receipts and non-automated founder DMs.

## Email-to-call handoff operational rule
- Email remains the primary route until an eligible verified decision-maker needs a call.
- Only five documented exceptions may create a paused call task: requested callback, recorded bounce/rejection, email unavailable, positive reply, or founder-priority exception with evidence.
- The owner assigns Caller A/B and date, adds an objective note, and confirms a direct phone plus verified department/decision authority.
- A created task uses `call_status=paused`, `route_status=verified_email_to_call_handoff`, and cannot dial. Do not count it as an attempted or completed call.
- Duplicate open assignments for the same account and POC are reused instead of created again.
- 2026-10-13 database QA used a rolled-back handoff; 52 original paused tasks remained and no call was made.
