# Newsletter Send Plan — Week of 2026-09-21

Owner: Kollective Marketing OS
Timezone: America/New_York
Rule: Brand audiences, consent, sender identity, tracking and reporting remain isolated by entity. No cross-brand sender fallback.

## Campaign schedule

| Brand / Division | Campaign Key | Intended Send | Audience | Creative | Execution State |
|---|---|---:|---|---|---|
| The Kollective | `newsletter:2026-09-22:the-kollective:weekly-roundup` | Tue Sep 22, 10:00 AM ET | The Kollective consented subscribers | KOLLECTIVE NEWSLETTER PG1.png + PG2.png | Authorized pending audience sync |
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
8. Current Supabase marketing-consent tables contain no active records for this package, so no live bulk send is authorized until consented brand audiences are synced.

## QA before release

- [ ] Exact sender verified + connected
- [ ] Exact GHL location PIT verified where HighLevel is the transport
- [ ] Correct brand audience synced
- [ ] Suppressions / unsubscribes applied
- [ ] Creative image hosted in email-safe public media
- [ ] Mobile preview checked
- [ ] CTA destination verified
- [ ] Test send received
- [ ] Production schedule confirmed in provider
- [ ] Provider campaign/source ID written back to Supabase
- [ ] Delivery/open/click/bounce reporting reconciled after send
