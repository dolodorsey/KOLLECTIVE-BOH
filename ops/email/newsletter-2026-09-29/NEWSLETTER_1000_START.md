# Newsletter 1K Start — 2026-09-29

Founder directive:
- Initial live ceiling: **1,000 recipients per entity/newsletter lane**.
- Required QA recipient before live release: **thedoctordorsey@gmail.com**.
- Every live send must preserve brand isolation and use the entity's verified sender/route.
- A database schedule is not send proof. Provider acceptance requires a provider message ID; delivery truth comes from provider delivery/inbox evidence.
- Newsletter visible body remains graphic-first / graphic-only where that operating standard already applies; no attachment.
- Never bypass unsubscribe, suppression, audience qualification, or provider reputation safeguards to force the 1,000 count.

## Active lanes
- GOOD TIMES — HighLevel; hold new production creative until founder supplies the new newsletter graphics.
- The Kollective — HighLevel.
- ICONIC LIVE / Nightmare on Channelside — HighLevel via authorized Kollective transport while retaining ICONIC campaign identity.
- S.O.S. — HighLevel; provider-qualified audience only for provider-recruitment campaigns.
- Sole Exchange — HighLevel.
- Hakuna Matata — HighLevel routed through approved sender.
- Mission 365 — preserve owner hold unless founder explicitly reactivates production sending.
- STUSH — **DUAL ROUTE: HighLevel + Shopify Email.** Initial STUSH total cap remains 1,000, split 500 HighLevel / 500 Shopify by default. Cross-provider email dedupe is required for 72 hours so the same person is not hit twice. Both routes remain brand-isolated as STUSH.

## Test policy
1. Send one exact-package test to the founder QA inbox.
2. Verify recipient inbox receipt, visible body, no attachment, From identity, and spam/inbox placement.
3. Record provider message ID.
4. Only then release eligible recipients up to the 1,000 ceiling.
5. If test lands in spam or authentication/reputation is unhealthy, keep the 1,000 cap programmed but do not force the blast; repair sender/auth/list quality first.

## Shopify
STUSH must execute through **both HighLevel and Shopify Email**. HighLevel is an approved production route, and Shopify Email remains an approved production route. The connected Shopify Admin API can manage store/customer resources and campaign attribution, but the current connector does not expose a provider-side Shopify Email send/schedule action. Provider-side Shopify Email execution therefore still requires the Shopify Email admin surface unless/until an authorized send endpoint is available. Never mislabel a database schedule as a Shopify send.

### STUSH provider allocation
- HighLevel: up to 500 of the initial 1,000
- Shopify Email: up to 500 of the initial 1,000
- Dedupe: 72-hour cross-provider suppression
- HighLevel authentication: SPF pass / DKIM pass / DMARC pass
- Current Gmail test placement: spam, so seed-before-scale applies even though authentication is clean.

## GOOD TIMES
Founder will supply new GOOD TIMES newsletter graphics. Do not recycle the old Date Night / previous graphics as the new production package. When new assets arrive: stage → build exact graphic-only HTML → founder QA test → verify inbox → release up to 1,000 eligible Atlanta recipients.


## Sender-auth remediation — 2026-09-29

Founder Gmail raw-MIME QA produced the following transport truth:

- GOOD TIMES: SPF pass, DMARC pass, **DKIM permerror because selector pic has no public key** for mail.thegoodtimesworldwide.com. Do not release the 1,000 until that DNS record is restored and founder QA passes.
- STUSH HighLevel: SPF pass, DKIM pass, DMARC pass. Spam placement is reputation/content related, not an authentication failure. Dual GHL + Shopify is enabled.
- S.O.S.: SPF pass, DKIM pass; Gmail did not report a DMARC result. Verify/add root-domain DMARC for superherosonstandby.com before 1,000 release.
- Sole Exchange: SPF/DKIM/DMARC pass. Use seed-before-scale because the founder QA message still landed in spam.
- Kollective: SPF/DKIM/DMARC pass and founder QA landed in Inbox; this is the current control sender.
- ICONIC LIVE / Nightmare: same authenticated Kollective transport, but founder QA landed in spam; treat as content/reputation warmup.
- Hakuna Matata: generic msgsndr.org visible sender was wrong. The newsletter dispatcher was upgraded to honor the existing Kollective sender-route override.
- Mission 365: a Kollective sender-route override is staged, but production remains on owner hold.

### Runtime repair
`ghl-newsletter-dispatch-v4` was upgraded to version 5 to honor newsletter sender-route overrides. If an override uses a different HighLevel location, the dispatcher resolves/upserts the recipient into the sender location before sending and records the routed sender/contact evidence.
