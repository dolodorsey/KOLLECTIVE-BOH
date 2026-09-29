# Email Blast OS v1 — 2026-09-29

## Architecture
- **Supabase = control plane + source of truth.**
  - Canonical newsletter assets live in `private.newsletter_asset_registry_v1`.
  - Per-entity blast programs live in `private.newsletter_blast_program_v1`.
  - Executable newsletter packages live in `public.newsletter_campaigns`.
  - Caps / deliverability / route rules live in `public.newsletter_send_policy_v3`.
  - Provider execution receipts live in `public.ghl_email_queue`.
- **HighLevel = primary send engine** for entities with a verified exact-location route.
- **Shopify Email = secondary send engine for STUSH**. STUSH starts at 500 GHL + 500 Shopify with cross-provider dedupe.
- **GitHub = versioned operating rules / manifest**, not the send engine.

## Founder volume directive
Every programmed focus entity starts with an initial **1,000-recipient ceiling per campaign**. Do not raise above 1,000 until founder reviews results.

A 1,000 cap does not bypass:
1. exact sender-route validation,
2. founder Gmail QA,
3. suppression / unsubscribe rules,
4. recipient verification,
5. the >5% provider-error automatic hold.

## Master automation
Supabase cron:
- `khg-focus-newsletter-orchestrator-v1`
- cadence: every 5 minutes
- function: `private.run_focus_newsletter_orchestrator_v1()`

The orchestrator only processes programs explicitly marked `armed` or `sending`. It checks campaign schedule and stops a program automatically when provider errors exceed 5% after a 25-recipient sample.

## Current asset library
Stored in Supabase asset registry:
- GOOD TIMES: 8 graphics
- Nightmare on Channelside / ICONIC LIVE: 4 graphics
- STUSH: 4 graphics
- FĚNYX: 4 graphics
- The Kollective: 3 graphics
- Hakuna Matata: 2 graphics
- S.O.S.: 2 graphics
- Sole Exchange: 1 graphic

All assets have provider CDN URLs, source filenames, source ChatGPT file IDs, campaign keys, sequence numbers, and brand ownership recorded.

## Current programs
### ICONIC LIVE / Nightmare on Channelside
Initial cap: 1,000.
First campaign: Tickets Are Live / Merch Drop Is Live.
Founder Gmail QA: **Inbox**.
Program state: **ARMED** for Sep 30, 2026 at 12:00 PM ET.
Three of four new NOC tests landed Inbox; Lineup + Merch Spotlight landed Spam and remains held.

### GOOD TIMES
Initial cap: 1,000.
Eight new graphics stored.
Six are current-use candidates.
Two are held because the art itself contains old year references (2024/2025).
Public release remains blocked by the missing GOOD TIMES DKIM public key for `pic._domainkey.mail.thegoodtimesworldwide.com`.
Atlanta-only audience remains mandatory.

### STUSH
Initial total cap: 1,000.
- GHL: 500
- Shopify Email: 500
All four new founder QA tests landed Inbox.
Shopify segment `STUSH | Email Subscribers` is verified at 921 members.
First 500 Shopify recipients are reserved internally.
GHL side remains in recipient-verification preparation; do not duplicate Shopify-reserved emails.

### FĚNYX
Initial cap: 1,000.
Four new newsletters stored and built.
Sender: `fenyx@bodegabodegabodega.com`.
GHL location: `iMnrTkqOiutj7ayQMeFT`.
Blocked only on missing exact-location PIT. Do not borrow another brand sender.

### The Kollective
Initial cap: 1,000.
New 2-page roundup and single-page ecosystem update are stored.
Founder QA landed Inbox.
First production seed was paused after provider rejects exceeded 5%; invalid addresses were suppressed.

### Hakuna Matata
Initial cap: 1,000.
Two new packages stored.
Founder QA landed Inbox through the approved Kollective transport.
Production seed paused after >5% provider rejects; invalid/unsubscribed contacts suppressed.

### S.O.S.
Initial cap: 1,000.
Two new provider-network packages stored.
Current founder Gmail placement: Spam.
Release remains held.

### Sole Exchange
Initial cap: 1,000.
New community-impact package stored.
Authentication clean; founder Gmail placement remains Spam.
Release remains held for reputation/list cleanup.

### Mission 365
Initial cap programmed at 1,000, but owner hold remains active.

### Other focus entities
A 1,000-cap blast program now exists for active focus brands even when creative or sender mapping is not ready. Those programs remain in states such as `waiting_creative`, `needs_sender_mapping`, or `blocked_sender_route`; no cross-brand sender substitution is allowed.

## Newsletter package standard
`25–80 words of brand-native visible intro → visible CTA → hero newsletter graphic(s) → no attachment`

Publication truth:
`PROGRAMMED → QA → VERIFIED AUDIENCE → PROVIDER ACCEPTED → PROVIDER MESSAGE ID → DELIVERY/PLACEMENT → METRICS`

A database timestamp alone is never send proof.
