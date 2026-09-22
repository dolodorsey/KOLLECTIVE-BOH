# Newsletter Audit — 2026-09-22

Status: EXECUTED / REMEDIATION IN PROGRESS  
Standard: `newsletter_operating_standard_v2`

## Executive findings

The creative quality is strong. The largest operational weaknesses were not the artwork; they were CTA fidelity, link health, recipient rotation, audience materialization, and stale GHL pipeline cache.

Repairs completed during the audit:
- dead ICONIC ticket destination replaced with the canonical Ticketmaster event URL;
- Sole Exchange donation CTA now lands directly on the donation flow;
- Mission 365 donor/monthly-giving GHL pipeline created;
- Nightmare ticket + merch conversion GHL pipeline created;
- S.O.S. segmentation rule repaired from unrelated entertainment/nightlife targeting to provider-qualified targeting;
- newsletter rotation changed to never-mailed first, then least-recently-mailed;
- default 72-hour / 2-per-7-day frequency control implemented;
- event urgency 24-hour / 3-per-7-day control implemented;
- newsletter warmup now counts only newsletter traffic;
- live GHL pipeline provider readback reconciled into local cache;
- owned-product preload subscriber materialization expanded;
- v2 GHL rendering + sequence templates activated.

## Separate campaign audit

| Entity | Creative / CTA | Destination | Conversion Pipeline | Sequence | Current gap |
|---|---|---|---|---|---|
| The Kollective | Strong multi-CTA roundup | Healthy | THE KOLLECTIVE \| Audience Growth | 72h / max 2 in 7d | Needs sliced click zones for each visible CTA |
| S.O.S. | Strong single provider CTA | Healthy provider apply flow | S.O.S. \| Provider Recruitment & Activation | 72h / max 2 | Provider segmentation repaired; 46 provider-qualified subscribers in snapshot |
| Mission 365 | Strong donor story, multiple CTAs | Healthy | MISSION 365 \| Donor / Monthly Giving | 72h / max 2 | Multi-CTA graphic needs independent click zones |
| Hakuna Matata | Strong book editorial, multiple CTAs | Shop is healthy | HAKUNA MATATA \| READER ACQUISITION | 72h / max 2 | READ THE EXCERPT has no verified dedicated excerpt route; current shop destination is only a partial match |
| Sole Exchange | Strong impact / donation story | Direct donation flow healthy | SOLE EXCHANGE \| Shoe Intake & Restoration | 72h / max 2 | Primary CTA fixed; partnership CTA still needs separate zone |
| ICONIC LIVE / NOC | Concert creative has clear ticket goal | Ticket destination repaired to official Ticketmaster | NIGHTMARE ON CHANNELSIDE \| Ticket + Merch Conversion | 24h / max 3 | Merch graphic also exposes ticket CTA; separate ticket zone still needed |
| Good Times | Excellent editorial quality; several multi-CTA graphics | Homepage healthy | Good Times \| User Acquisition & Lifecycle | 72h / max 2 | Weekly + Date Night need sliced CTA zones/deep links; Next 30 Days needs a verified direct calendar route |

## GHL live pipeline audit

Provider API readback succeeded for all newsletter operating locations.

Live pipeline counts at audit:
- Good Times: 44
- S.O.S.: 45
- Mission 365: 45 after donor pipeline deployment
- Hakuna Matata: 39
- Sole Exchange: 35
- The Kollective location: 61 after Nightmare pipeline deployment

The local `ghl_pipelines` cache was materially stale before this audit. It is now reconciled from provider readback and a daily reconciliation job is active.

### Pipelines created in this audit

**MISSION 365 | Donor / Monthly Giving**  
GHL pipeline ID: `5YYhPIFW0yiA9glSQYeh`

Stages:
1. Newsletter / Campaign Engaged
2. Giving Page Visited
3. Donation Started
4. Monthly Plan Selected
5. First Gift Completed
6. Recurring Donor Active
7. Upgrade / Referral
8. At Risk / Paused
9. Canceled / Lapsed

**NIGHTMARE ON CHANNELSIDE | Ticket + Merch Conversion**  
GHL pipeline ID: `z9UyxIvXYSBzct6JITgI`

Stages:
1. Newsletter / Campaign Engaged
2. Ticket Page Visited
3. Checkout Started
4. Ticket Purchased
5. VIP / Upgrade
6. Merch Shopper
7. Merch Purchased
8. Event Attended
9. Next Event / Retention

## Audience audit snapshot

Subscriber materialization is active and continues in the background.

Snapshot during audit:
- Good Times: 6,337
- The Kollective: 515 and growing
- S.O.S. provider-qualified: 46
- Mission 365: 1
- Sole Exchange: 3
- Hakuna Matata: 0 from its exact-location preload
- ICONIC: event-specific audience still needs materialization; do not substitute the general Kollective audience

The S.O.S. import was independently checked after a nullable-filter bug was found during the audit. 394 incorrectly admitted rows were removed, leaving 46/46 verified provider-qualified rows.

## Current link repairs

- Nightmare ticket tracking now resolves to the official Ticketmaster event.
- Sole Exchange DONATE YOUR PAIR tracking now resolves to the direct donation page.
- Hakuna Matata now resolves to the book shop rather than the generic homepage, but a dedicated excerpt/release-list landing page remains the correct final fix.

## Runtime cadence

- preload segmentation import: every 5 minutes
- subscriber → GHL materialization: every 2 minutes
- newsletter enrollment: every 5 minutes
- GHL dispatch: every 2 minutes
- receipt reconciliation: every 1 minute
- newsletter ramp review: daily
- GHL pipeline cache/provider reconciliation: daily

## Priority remaining work

1. Build sliced click-zone versions of current multi-CTA newsletters without changing their visible artwork.
2. Add verified deep routes for Good Times Calendar / Date Night and Hakuna Excerpt / Release List.
3. Materialize an event-specific ICONIC audience from existing enterprise subscribers using event relevance, ticket/event engagement, and existing event sources — not general parent-list blasting.
4. Continue relevance segmentation for smaller owned products with low exact-location preload counts.
5. Add conversion-stage event writes so tracked clicks and transactions automatically move contacts through the mapped GHL pipeline.
