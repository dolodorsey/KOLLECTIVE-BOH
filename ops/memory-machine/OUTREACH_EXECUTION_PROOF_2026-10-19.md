# MEMORY MACHINE — OUTREACH EXECUTION CONTROL (2026-10-19)

**Brand:** MEMORY MACHINE only. **Parent OS:** KOLLECTIVE BOH. **Status:** Research/qualification live; all external sends remain on founder hold.

## Source of truth
- Supabase project: `wfkohcwxxsrhcxhepfql` (KOLLECTIVE BOH).
- Existing Google Sheet: https://docs.google.com/spreadsheets/d/1OTHrkYl07-YbZX6YlkUKA5W6rVRQefoyM5IjkGBTxok/edit
  - `MEMORY MACHINE` holds research candidates and source URLs.
  - `MEMORY MACHINE - WAVE 1` holds 25 suggested high-fit venue reviews, including pre-existing Fernbank.
- Dedicated outreach batch ID: `f184e325-8adb-4cd7-8c11-7368c64b568f`.
- Batch key: `2026-10-19:memory-machine:atlanta-sourced-100:research-only`.
- Live public Memory Machine URL (observed HTTP 200 on homepage and /for-venues): https://memory-machine-sigma.vercel.app

## Verified ledger, not invented activity
- Pre-existing Memory Machine outreach accounts: **167**.
- Newly imported Atlanta accounts: **100**.
- Current total: **267** (Supabase SQL readback).
- New batch items: **100**, all currently `not_contacted` and `unverified`.
- Top-ranked **24** newly imported targets + **one** pre-existing Fernbank record in the Google Sheet's 25-line Wave 1 view. Do not duplicate Fernbank into the new 100-account cohort.
- Memory Machine external outreach activity (before new intake and held batch): **0**.
- Previously existing Muse tasks: 45, including 44 marked blocked due to founder hold. Their blocked status is intentional, not evidence that sends failed.
- No GHL import/send is authorized or verified. Never convert records to "sent", "qualified", "installed", "sponsored", or "revenue" without receipts.

## Implemented 2026-10-19
1. Loaded 100 candidate businesses as `outreach_accounts` with:
   - `entity_key='memory-machine'`, `lane='memory_machine_venue'`;
   - segment in `account_type` (nightlife, restaurant, attraction, or events);
   - original source IDs, source URLs and publicly listed routes;
   - `status='research'`, `active=false`, `metadata.outreach_authorized=false`.
2. Created the dedicated 100-item `outreach_batches` / `outreach_batch_items` cohort. Items are ranked and explicitly gated at research; first 24 follow the Wave 1 priority sheet.
3. Updated the existing queued Muse internal-research mission `05927a52-440d-4cd9-be64-e077a8371e7e` and task `90c74f7b-9549-4b42-9c26-e6e91448351b` with the exact batch ID. These writes **do not prove Muse execution or acceptance**.
4. Applied Supabase migration `memory_machine_inbound_venue_to_research_20261019`. It adds a private `SECURITY DEFINER` trigger function `private.memory_machine_venue_intake_research_router`, invoked only AFTER INSERT into `public.memory_machine_site_leads`. A first-party, consented `venue_application` now creates an internal research-only `outreach_accounts` entry when the brand/venue combination is not already present. It never sends, imports into GHL, or advances approval.
5. Transaction test: synthetic venue application created research-only account inside a transaction; after rollback both synthetic lead and account counts were **0**, while production accounts remained **267**.

## Production send gate
**Never authorize external action based on a row existing, a source URL, an agent route, an active dataset, or a queued mission alone.**

For each venue or sponsor verify: business still operates; named authority; right offer/channel; DNC/suppression and permission; venue equipment/space/power, exclusivity, installation insurance, and brand/sponsor restrictions. Require explicit founder-approved offer + exact sender identity/channel/recipient + approved creative + provider readback. Muse may draft and QA while held, not transmit.

## Read-only SQL QA
```sql
SELECT count(*) AS all_accounts,
       count(*) FILTER (WHERE metadata->>'import_batch'='MM-ATL-20261019') AS new_20261019,
       count(*) FILTER (WHERE metadata->>'import_batch'='MM-ATL-20261019' AND active) AS imported_active
FROM public.outreach_accounts WHERE entity_key='memory-machine';

SELECT b.batch_key,b.item_count,count(i.id) AS actual_items,
       count(i.id) FILTER (WHERE i.touch_status='not_contacted') AS not_contacted,
       count(i.id) FILTER (WHERE i.contact_readiness='unverified') AS contact_unverified
FROM public.outreach_batches b
LEFT JOIN public.outreach_batch_items i ON i.batch_id=b.id
WHERE b.batch_key='2026-10-19:memory-machine:atlanta-sourced-100:research-only'
GROUP BY b.batch_key,b.item_count;

SELECT lane,active FROM public.outreach_lane_policies WHERE entity_key='memory-machine';
SELECT tgname FROM pg_trigger WHERE tgrelid='public.memory_machine_site_leads'::regclass AND NOT tgisinternal;
```

## Remaining external and release gates
- Vercel project's current production alias served its prior READY deployment. Later unrelated repo preview builds were CANCELED; those do not mean the existing public alias was down. New UI release is **not** asserted.
- Vercel environment listing returned 403; no secrets were read. Verify exact Memory Machine site-specific sender / Supabase / GHL bindings through an authorized operator before additional release.
- Headless browser screenshot automation was blocked by network policy; HTTP 200 is not visual or full form QA.
- End-to-end non-production application form QA, GHL sync test, sponsor-code test, reply-to-inquiry process, and provider receipts remain required. Use explicit QA payloads and remove them, retaining anonymized proof.
- Sponsor/event-buyer expansion (30 sponsor targets + 20 event buyers) remains a sourcing target, not an imported or approved inventory count.

**Operating principle:** `sourced != verified != authorized != sent != installed != collected`.


## Additional program controls completed (same date)
- Added inactive outreach lanes `memory_machine_sponsor` and `memory_machine_event_buyer`, each with exact Memory Machine-only sender requirements and external dispatch disabled.
- Created empty, honest research batches `2026-10-19:memory-machine:sponsors:research-30` (target 30, actual 0) and `2026-10-19:memory-machine:event-buyers:research-20` (target 20, actual 0). These are research quotas, not fabricated contacts or outreach-ready audiences.
- Added `MEMORY MACHINE - PROGRAM QA` tab to the existing Outreach Command Center, with 16 workstreams, evidence pointers, owners, blockers, and outbound gates. Supabase counts in the tab are a dated readback snapshot, not a live connector.
- Further rollback-only QA inserted two matching venue applications plus one sponsor inquiry in a single transaction. Within the transaction the router generated exactly **one** venue research account and **zero** sponsor-as-venue accounts. After rollback, synthetic lead and account residue was **0**.
- Vercel live alias `https://memory-machine-sigma.vercel.app/` and `/for-venues` both returned HTTP **200**, served from the most recent READY production build. Later canceled deployments did not take the live alias offline.
- Vercel project environment metadata returned **403**, and a local headless screenshot attempt was denied by network policy. No env access, desktop/mobile screenshot, actual form POST or new website deployment is asserted.

## Final direct-readback checkpoint
- GitHub PR #27 merged as \`b30176126492771e905ff2d220840d0716e8d197\`; automated "BOH Current Architecture" check succeeded on the PR head.
- All 25 Wave 1 account records (24 of the new 100, plus pre-existing Fernbank) are now tagged in \`outreach_accounts.metadata.memory_machine_wave1_rank\`; \`priority_tier='wave1_research'\`. Rechecked: 25 tagged, **0 activated**. No venue was marked qualified or contacted.
- Site lead \`venue_application\` and \`sponsor_inquiry\` now route to distinct internal \`outreach_accounts\` lanes. Both create a **blocked_scope** GHL contact import-review record for an accepted first-party inquiry; no GHL import or outbound send occurs. The \`memory_retrieval\` form never creates a commercial account or GHL job.
- Three Memory Machine lane policies were read back as inactive: \`memory_machine_venue\`, \`memory_machine_sponsor\`, \`memory_machine_event_buyer\`.
- Five existing Memory Machine Muse send streams were checked: all \`sender_verified=false\`, \`send_authorized=false\`, \`delivery_enabled=false\`.
- There are **0** actual rows in \`memory_machine_site_leads\` and **0** actual Memory Machine GHL-import jobs at this checkpoint; end-to-end production form submission is **not** verified. Transactional QA was successful, no synthetic data persisted.
- Google Sheet \`MEMORY MACHINE - PROGRAM QA\` was updated after the merge. All numbers are point-in-time snapshots, not a live two-way sync.
