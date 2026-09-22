# Newsletter Operating Standard v2

Status: LOCKED / ACTIVE  
Effective: 2026-09-22  
Execution layer: HighLevel  
Control plane: Supabase  
Version control: GitHub

## 1. Visible email body

The approved newsletter graphic **is the newsletter**.

Production rules:
- No JPG/PNG/PDF attachment treatment.
- No visible intro copy, wrapper copy, QA label, extra footer, or separate CTA button.
- Hidden preheader text is allowed.
- Responsive artwork: width 100%, max-width 620px, height auto.
- Multi-page newsletters render pages in order with no visible copy between pages.
- Inbox QA must prove `has_attachment=false` and the expected hosted graphic exists in the received HTML.

## 2. CTA architecture

### Single primary CTA
One full-width graphic may be linked to one tracked destination when the creative clearly has one conversion action.

Required:
- CTA language and landing page intent match.
- Destination is live before release.
- Tracking redirect is active.
- Raw destination is recorded separately from the tracking URL.

### Multiple visible CTAs
A graphic that visually presents different buttons/actions must not pretend each button has independent behavior when the whole artwork has only one link.

Use one of:
1. sliced, seamlessly reconstructed image zones with separate tracked destinations; or
2. a future creative revised to one primary CTA.

Image maps, absolute-position overlays, or client-specific hacks are not the production standard.

## 3. Link and landing-page gate

Before release:
- tracked URL exists;
- raw destination exists;
- destination is healthy;
- CTA semantics match the destination;
- DNS failure blocks send;
- provider bot protection may be accepted only when the canonical URL is verified through the provider's public browser surface.

Every broken destination is a P0 newsletter defect.

## 4. Audience model

Founder directive: preloaded company contacts are existing enterprise subscribers. Owned products are smaller audience segments within the same enterprise.

This permits product segmentation of the existing subscriber base, but:
- DND, unsubscribe, suppression, complaint, bounce, and channel restrictions always win;
- newly sourced cold prospects are not automatically subscribers;
- the same enterprise subscriber should be assigned by relevance, not blasted by every product;
- event-specific and provider-specific campaigns still require the relevant segment;
- sender sharing does not authorize audience sharing.

## 5. Recipient rotation and frequency

Default:
- never-mailed recipients first;
- then least-recently-mailed;
- 72-hour same-brand newsletter contact gap;
- maximum 2 brand newsletters per contact in a rolling 7 days;
- no automatic open-based resend;
- never send the same campaign twice to the same contact.

Event urgency:
- 24-hour contact gap;
- maximum 3 event newsletters per contact in 7 days;
- one event email per day during sender warmup unless explicitly changed.

## 6. Warmup

Ten recipients is a batch, not a daily limit.

Ramp:
**50 → 75 → 100 → 150 → 250 → 400 → 650 → 1,000/day**

The next rung requires:
- current rung completed;
- zero provider errors for the newsletter lane;
- healthy delivery evidence;
- no suppression/consent failure.

Warmup metrics count **newsletter sends only**. Unrelated outreach does not advance newsletter warmup.

## 7. HighLevel conversion mapping

Every production newsletter must map to a real GHL pipeline that represents the CTA's business outcome.

Required fields in campaign metadata:
- GHL location ID
- pipeline ID
- pipeline name
- campaign key
- tracked CTA
- contact-gap policy
- frequency cap
- rendering standard
- provider receipt

Provider readback is authoritative. Local pipeline cache is reconciled after provider writes and daily thereafter.

## 8. Sequence

Newsletter execution sequence:

1. Audience eligibility / suppression
2. Never-mailed-first rotation
3. Frequency-gap check
4. Approved creative + subject + hidden preheader
5. Tracked destination health check
6. Graphic-only inbox QA
7. GHL enrollment
8. 10-recipient dispatch batches
9. Provider receipt
10. Click / conversion / pipeline attribution
11. Deliverability review
12. Next-rung decision
13. Post-send reconciliation

## 9. Reporting

Report separately by entity:
- eligible audience
- queued
- accepted/sent
- provider errors
- click-through
- CTA conversion
- unsubscribes
- bounce/complaint
- pipeline movement
- warmup rung
- last contact
- next eligible contact time

No cross-brand attribution blending.

## 10. Current approved sender exception

ICONIC LIVE / Nightmare on Channelside may use The Kollective transport. The campaign, audience, tracking, suppression, conversion pipeline, and reporting remain ICONIC/event-specific.

## 11. Current GHL standard objects

- `newsletter_operating_standard_v2_single_cta`
- `newsletter_operating_standard_v2_multi_cta`
- `newsletter_sequence_standard_v2`

The older graphic-only templates are retained as inactive history.
