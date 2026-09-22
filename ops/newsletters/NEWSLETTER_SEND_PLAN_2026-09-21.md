# Newsletter Send Plan — Week of 2026-09-21

Owner: Kollective Marketing OS
Timezone: America/New_York
Rule: Brand audiences, consent, sender identity, tracking and reporting remain isolated by entity. No cross-brand sender fallback. The weekly creative is distributed through daily incremental cohorts so each active sender builds healthy volume every day.

## Campaign schedule

| Brand / Division | Campaign Key | Intended Send | Audience | Creative | Execution State |
|---|---|---:|---|---|---|
| The Kollective | `newsletter:2026-09-22:the-kollective:weekly-roundup` | Tue Sep 22, 10:00 AM ET | The Kollective consented subscribers | KOLLECTIVE NEWSLETTER PG1.png + PG2.png | Media + tracking + founder test complete; authorized pending consent-audience sync |
| S.O.S. | `newsletter:2026-09-22:s-o-s:provider-early-access` | Tue Sep 22, 1:30 PM ET | Provider early-access list only | S.O.S. NEWSLETTER.png | Blocked: exact HighLevel location PIT + provider audience consent sync required |
| ICONIC LIVE / Nightmare on Channelside | `newsletter:2026-09-23:concert-tampa-halloween:concert-update` | Wed Sep 23, 11:00 AM ET | Event-consented attendees / prospects | NOC NEWSLETTER.png | Blocked until exact entity sender is executable |
| Mission 365 | `newsletter:2026-09-24:mission-365:weekly` | Thu Sep 24, 10:30 AM ET | Mission 365 consented subscribers | MISSION 365 NEWSLETTER.png | Blocked until exact entity sender is executable |
| Hakuna Matata | `newsletter:2026-09-25:hakuna-matata:weekly` | Fri Sep 25, 10:30 AM ET | Hakuna Matata consented subscribers | HAKUNA NEWSLETTER.png | Blocked until exact entity sender is executable |
| The Sole Exchange | `newsletter:2026-09-26:sole-exchange:weekly` | Sat Sep 26, 10:00 AM ET | Sole Exchange consented supporters | SOLE NEWSLETTER.png | Blocked until exact entity sender is executable |
| ICONIC LIVE / Nightmare on Channelside | `newsletter:2026-09-26:concert-tampa-halloween:merch-drop` | Sat Sep 26, 1:00 PM ET | Event-consented attendees / prospects | NOC MERCH NEWSLETTER.png | Blocked until exact entity sender is executable |

## Approved email package

### The Kollective
Subject: This week across Dr. Dorsey / The Kollective  
Preheader: Live events, culture, community, products — and what’s moving next.  
Primary CTA: FOLLOW THE MOVEMENT

### S.O.S.
Subject: Founding providers: join the S.O.S. network  
Preheader: Early access for towing, repair, oil change, wash, detailing and mobile service partners.  
Primary CTA: APPLY FOR EARLY ACCESS

### ICONIC LIVE / Nightmare on Channelside — Concert
Subject: Nightmare on Channelside: Tampa, Oct. 31  
Preheader: Tickets are live for Tampa’s biggest Halloween concert.  
Primary CTA: GET TICKETS NOW

### Mission 365
Subject: Make giving easier. Make fundraising stronger.  
Preheader: Mission 365 turns larger gifts into manageable monthly giving.  
Primary CTA: START MONTHLY GIVING

### Hakuna Matata
Subject: Hakuna Matata: The Power in Peace  
Preheader: Less noise. More purpose. A calmer, stronger you.  
Primary CTA: READ THE EXCERPT

### The Sole Exchange
Subject: Give white Air Force 1s another life  
Preheader: Clean kicks. Brighter futures. Stronger communities.  
Primary CTA: DONATE YOUR PAIR

### ICONIC LIVE / Nightmare on Channelside — Merch
Subject: Nightmare merch is now live  
Preheader: Lock in your concert fit before event week.  
Primary CTA: SHOP MERCH

## Runtime gates

1. Creative approval is granted by Dr. Dorsey in the 2026-09-21 newsletter programming request.
2. Live sends require the exact entity sender to be verified, connected and executable.
3. Live sends require a brand-specific consented audience and suppression/unsubscribe enforcement.
4. The S.O.S. campaign is provider-only; it must not enroll a consumer audience.
5. The Kollective two-page creative renders PG1 first, then PG2.
6. The direct HighLevel connector returned an IAM 401 during this programming pass. S.O.S. also lacks the exact persisted location PIT required by the runtime guard. Do not bypass either condition by borrowing another brand sender.
7. Supabase `marketing_native_campaigns` is the canonical send-control record for this week's package.
8. Current Supabase marketing-consent tables contain no active records for this package, so no live bulk send is authorized until consented brand audiences are synced.\n9. All eight newsletter graphics are staged as email-safe public Shopify CDN media and all seven campaigns have tracked CTA routes written into Supabase.\n10. The Kollective founder QA test was sent from the exact Kollective Gmail sender to the founder review inbox; Gmail message ID: `1a0c6c696acbc1d3`.

## QA before release

- [ ] Exact sender verified + connected
- [ ] Exact GHL location PIT verified where HighLevel is the transport
- [ ] Correct brand audience synced
- [ ] Suppressions / unsubscribes applied
- [x] Creative image hosted in email-safe public media
- [ ] Mobile preview checked
- [x] CTA destination routes generated and written to Supabase
- [ ] Test send received
- [ ] Production schedule confirmed in provider
- [ ] Provider campaign/source ID written back to Supabase
- [ ] Delivery/open/click/bounce reporting reconciled after send


## Daily sender ramp — revised 2026-09-21

The prior one-send-per-brand weekly cadence is superseded by a daily cohort model.

| Entity | Daily slot (ET) | Cohort rule | Ramp target |
|---|---:|---|---|
| The Kollective | 8:30 AM | New consented recipients only | 10 → 25 → 50 → 100 → 250 → 500 → 1,000 |
| S.O.S. | 10:45 AM | Provider-only; new consented recipients only | 10 → 25 → 50 → 100 → 250 → 500 → 1,000 |
| Mission 365 | 1:00 PM | New consented recipients only | 10 → 25 → 50 → 100 → 250 → 500 → 1,000 |
| Hakuna Matata | 3:15 PM | New consented recipients only | 10 → 25 → 50 → 100 → 250 → 500 → 1,000 |
| Sole Exchange | 5:30 PM | New consented recipients only | 10 → 25 → 50 → 100 → 250 → 500 → 1,000 |
| ICONIC LIVE / Nightmare | 7:45 PM | One event email/day; rotate approved concert + merch content | 10 → 25 → 50 → 100 → 250 → 500 → 1,000 |

### Daily scale rule

- Every active entity gets its own daily send window, 135 minutes apart.
- Volume can advance one rung after 24 hours of healthy provider/delivery evidence.
- The same recipient is never counted as a new warm-up send twice for the same campaign.
- A sender does not advance when bounce, complaint, unsubscribe, provider-failure, throttling, consent, suppression, or exact-sender gates fail.
- ICONIC LIVE uses one daily sender slot even though two approved newsletter creatives exist; do not double-send the entity during warm-up.
- Supabase `communication-send-ramp-refresh-v1` evaluates ramp state hourly; `khg-enterprise-autonomy-tick` evaluates due daily operations every five minutes.


## Ramp v3 — founder direction 2026-09-21

The sender warm-up policy is now **50 production recipients/day to start**, executed in **10-recipient chunks**, not 10 recipients/day.

Ramp ladder: **50 → 75 → 100 → 150 → 250 → 400 → 650 → 1,000/day**, with a 24-hour healthy-delivery gate before each increase. Any throttle, provider failure, bounce/complaint/unsubscribe threshold breach, sender failure, consent failure, or suppression issue stops scaling.

Daily entity slots (America/New_York):
- 07:15 — Dr. Dorsey
- 08:15 — The Kollective
- 09:15 — Casper Group
- 10:15 — S.O.S.
- 11:15 — Infinity Water
- 12:15 — Mission 365
- 13:15 — Pronto Energy
- 14:15 — Hakuna Matata
- 15:15 — Sole Exchange
- 18:15 — ICONIC LIVE / Nightmare on Channelside

A single scheduled automation operates these slots. It may send only an approved campaign, from the exact entity sender, to that entity's eligible audience. Draft/unapproved content is prepared but held.

### Sender repairs completed
- Sole Exchange: brand-owned Gmail route reconciled into communication_sender_profiles.
- Casper Group: brand-owned Gmail route reconciled.
- Dr. Dorsey: brand-owned Gmail route reconciled.
- Infinity Water: brand-owned Gmail route reconciled.
- Pronto Energy: brand-owned Gmail route reconciled.
- The Kollective remains connected.
- S.O.S. transport is historically verified, but BOH exact-location PIT persistence remains a current execution gate.

### Consent intake
`public.sync_first_party_email_consent_v1()` now imports only explicit first-party consent from supported sources into the canonical `email_consent` table. It runs every 15 minutes via pg_cron. It does not infer consent from cold lead records, Gmail contacts, or unrelated brands.


## 2026-09-21 execution update — founder directives applied

- Production ramp floor is now **50 recipients per entity per day**, processed in **10-recipient chunks**.
- Ramp ladder: **50 → 75 → 100 → 150 → 250 → 400 → 650 → 1,000/day**, with advancement gated by healthy delivery evidence.
- **ICONIC LIVE / Nightmare on Channelside is explicitly authorized to use The Kollective Gmail sender** (`thekollectivehospitality@gmail.com`). This is a sender-only exception. ICONIC audience, tracking, suppression, reply handling, and reporting remain event-specific and cannot be merged with The Kollective audience.
- ICONIC shared-sender QA was delivered successfully to the founder review inbox. Gmail message ID: `1a0c703a3446083f`.
- ICONIC concert + merch campaigns moved from `blocked_sender` to `authorized_pending_audience`.
- Dr. Dorsey, Infinity Water, and Pronto Energy email packages now have verified sender routes, tracked destinations, approved packages, launch authorization, and daily send slots. They remain gated by eligible audience availability.
- First-party consent sync now also ingests explicit consent from Nightmare giveaway + Halloween lead capture tables every 15 minutes.
- Current verified explicit-consent recovery from the inspected first-party sources is still zero for the active newsletter lanes; do not manufacture consent or reuse another entity's list.


## Execution architecture correction — 2026-09-21

Newsletter scheduling/execution is **not** owned by ChatGPT task automation.

- HighLevel is the execution/sending layer.
- Supabase is the control plane and source of truth for consent, suppression, campaign state, sender routing, ramp state, tracking, QA, and receipts.
- GitHub stores the operating standard.
- ChatGPT automation previously created for the daily entity email ramp has been disabled and marked migrated to GHL.
- Graphic rendering standard is locked in `ops/newsletters/GRAPHIC_ONLY_NEWSLETTER_STANDARD.md`.
- GHL runtime template standard is stored in the MCP Gateway `ghl_script_templates` table under `graphic_only_newsletter_standard` and `graphic_only_newsletter_multipage_standard`.
- Existing receipt-backed GHL email dispatcher/reconciler remains the execution transport path.


## 2026-09-22 — GHL runtime closeout

### Mission 365 + Hakuna Matata sender routes
Both previously blocked newsletter senders are now operational through exact GHL locations in the MCP Gateway.

- Mission 365 GHL location: `k0qCyTaLEJaIazRML7hs`
  - Contact upsert HTTP: 201
  - Email send HTTP: 201
  - GHL provider message ID: `OMkYOS5qm1R9NycKdIM9`
  - Gmail inbox proof: `1a0c7724cc5e4c39`
  - Inbox reports `has_attachment=false`
  - HTML contains the approved Mission 365 newsletter graphic as the visible body.
- Hakuna Matata GHL location: `my3t8XWT680gA5UWpoda`
  - Contact upsert HTTP: 201
  - Email send HTTP: 201
  - GHL provider message ID: `ysl1lDlcz9i8DlkcUZFs`
  - Gmail inbox proof: `1a0c772453e15f09`
  - Inbox reports `has_attachment=false`
  - HTML contains the approved Hakuna Matata newsletter graphic as the visible body.

The MCP Gateway `v_ghl_send_ready` now reports `email_ready=true` for Mission 365, Hakuna Matata, S.O.S., and The Kollective.

### Subscriber → GHL materialization
Added `public.sync_newsletter_subscribers_to_ghl_v1()` in MCP Gateway.

Behavior:
- Reads only active rows in `newsletter_subscribers`.
- Requires an active exact-brand row in `brand_ghl_map` with a PIT.
- Upserts each explicit subscriber into that exact GHL location.
- Mirrors the returned GHL contact ID into `ghl_outreach_contacts`.
- Preserves exact brand context and consent classification.
- Does not convert generic CRM contacts, scraped leads, or another entity's audience into subscribers.
- Runs every 2 minutes by pg_cron: `khg-newsletter-subscriber-ghl-sync-v1`.
- Public/anon/authenticated EXECUTE is revoked; cron/database owner execution only.

The first live sync completed with 1 existing Dr. Dorsey subscriber and 0 errors.

### First production cohort attempt
The GHL newsletter enqueuer + receipt-backed dispatcher were run after sender closeout.

Current result for the active newsletter lanes:
- The Kollective: 0 active newsletter subscribers
- S.O.S.: 0
- Mission 365: 0
- Hakuna Matata: 0
- Sole Exchange: 0
- ICONIC LIVE / Nightmare: 0

Therefore no real production recipients were queued. This is a valid HOLD, not an execution failure. The system is ready to enqueue up to the current 50/day warm-up cap automatically as soon as explicit brand subscribers exist and are mirrored into their exact GHL location.

Do not manufacture subscribers to fill a warm-up quota.
