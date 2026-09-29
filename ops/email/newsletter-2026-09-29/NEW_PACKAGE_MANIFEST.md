# New Newsletter Package Manifest — 2026-09-29

Founder supplied the new packages below. All graphics are hosted on the connected Shopify CDN for email delivery and the campaigns use **graphic-first deliverability hybrid v3**: visible intro copy + visible CTA + hero graphic(s), no attachment.

## FĚNYX
Initial cap: 1,000.
Sender directive: `fenyx@bodegabodegabodega.com`.
HighLevel location: `iMnrTkqOiutj7ayQMeFT`.
Current gate: **BLOCKED — exact-location PIT missing. Do not borrow another brand sender.**

Campaign sequence:
1. Performance Essentials — `https://cdn.shopify.com/s/files/1/0759/7506/5791/files/fenyx-performance-essentials.png?v=1790663916`
2. Court to Street — `https://cdn.shopify.com/s/files/1/0759/7506/5791/files/fenyx-court-to-street.png?v=1790663920`
3. Recovery + Outerwear — `https://cdn.shopify.com/s/files/1/0759/7506/5791/files/fenyx-recovery-outerwear.png?v=1790663925`
4. Women's Studio Edit — `https://cdn.shopify.com/s/files/1/0759/7506/5791/files/fenyx-womens-studio-edit.png?v=1790663930`

## Hakuna Matata
Sender route: approved Kollective parent transport.
QA result: **both new packages landed in founder Gmail Inbox**.
Initial live package: **A Message from Dr. Dorsey**.
A production seed started, then was paused after provider rejects exceeded the 5% list-quality threshold. Invalid addresses were suppressed.
1. Message from Dr. Dorsey — `https://cdn.shopify.com/s/files/1/0759/7506/5791/files/hakuna-message-dr-dorsey.png?v=1790663934`
2. The Power in Peace — `https://cdn.shopify.com/s/files/1/0759/7506/5791/files/hakuna-power-in-peace.png?v=1790663939`

## The Kollective
QA result: **both new packages landed in founder Gmail Inbox**.
Initial live package: **Weekly Roundup — 2 page**.
A production seed started, then was paused after provider rejects exceeded the 5% list-quality threshold. Invalid addresses were suppressed.
1. Weekly Roundup Part 1 — `https://cdn.shopify.com/s/files/1/0759/7506/5791/files/kollective-weekly-roundup-part1.png?v=1790663944`
2. Weekly Roundup Part 2 — `https://cdn.shopify.com/s/files/1/0759/7506/5791/files/kollective-weekly-roundup-part2.png?v=1790663949`
3. Single-page Ecosystem Update — `https://cdn.shopify.com/s/files/1/0759/7506/5791/files/kollective-weekly-roundup-single.png?v=1790663953`

## Sole Exchange
QA result: new package still lands in **Spam** despite authenticated transport.
Status: hold for reputation/list-quality remediation before 1,000 release.
Asset: `https://cdn.shopify.com/s/files/1/0759/7506/5791/files/sole-exchange-community-impact.png?v=1790663957`

## S.O.S.
Both new provider-network packages were tested. Both currently land in **Spam**; a neutral-subject / longer-copy retest also landed in Spam.
Status: hold production release until sender/reputation placement improves.
1. Provider Network A — `https://cdn.shopify.com/s/files/1/0759/7506/5791/files/sos-founding-provider-network-a.png?v=1790663962`
2. Provider Network B — `https://cdn.shopify.com/s/files/1/0759/7506/5791/files/sos-founding-provider-network-b.png?v=1790663967`

## STUSH
Founder directive: **use BOTH HighLevel and Shopify Email**.
Initial total cap: **1,000**.
Operating split target: 500 HighLevel + 500 Shopify, with 72-hour cross-provider dedupe.

All four new HighLevel founder QA tests landed in **Inbox**:
1. Fall Edit — `https://cdn.shopify.com/s/files/1/0759/7506/5791/files/stush-fall-edit.png?v=1790663971`
2. Field Issue — `https://cdn.shopify.com/s/files/1/0759/7506/5791/files/stush-field-issue.png?v=1790663976`
3. Raw Material — `https://cdn.shopify.com/s/files/1/0759/7506/5791/files/stush-raw-material.png?v=1790663980`
4. After Hours — `https://cdn.shopify.com/s/files/1/0759/7506/5791/files/stush-after-hours.png?v=1790663985`

Shopify:
- Segment: `STUSH | Email Subscribers`
- Segment ID: `gid://shopify/Segment/580298965183`
- Current verified segment membership: **921**
- First 500 Shopify recipients are internally reserved for the initial dual-route allocation.

HighLevel:
- Authentication and founder-inbox placement are clean.
- GHL contact pool exists, but the new verified-send queue needs a clean 500-candidate allocation before live release.
- Do not duplicate Shopify-reserved recipients.

## Pending founder assets
- **Nightmare on Channelside / ICONIC LIVE** — waiting for new newsletter graphic(s).
- **GOOD TIMES** — waiting for new newsletter graphic(s). GOOD TIMES also remains blocked on the missing DKIM public key for `pic._domainkey.mail.thegoodtimesworldwide.com`.

## Release rule
No legacy package is allowed to release. New package only:
**asset → hybrid HTML → founder Gmail QA → provider receipt → inbox/list-quality gate → live allocation.**
