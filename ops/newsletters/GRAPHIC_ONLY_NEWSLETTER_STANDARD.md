# Graphic-Only Newsletter Body Standard

Status: LOCKED / ACTIVE  
Owner directive: 2026-09-21

## Core rule

The supplied newsletter graphic **is the newsletter**.

The visible email body must consist only of the approved newsletter graphic(s). Do not wrap the newsletter with additional visible marketing copy.

## Rendering requirements

- Render the newsletter artwork directly inside the HTML email body.
- Do **not** attach the artwork as JPG, PNG, PDF, or other downloadable file.
- No visible header.
- No visible intro copy.
- No visible QA labels.
- No visible explanatory copy.
- No visible footer added around the artwork.
- No separate CTA button added around the artwork.
- Hidden preheader text is allowed.
- Use responsive HTML image rendering: width 100%, max-width 620px, height auto.
- Public HTTPS image hosting is required.
- The entire graphic/page may be linked to the tracked CTA destination.
- For multi-page newsletters, render pages in order, vertically stacked, with no visible copy between pages.

## Production QA gate

Before production release, the received inbox copy must prove:

1. `has_attachment = false`.
2. The expected public graphic URL exists in the HTML body.
3. The graphic renders in the message body at responsive width.
4. The graphic click-through uses the approved tracked destination.
5. Multi-page newsletters preserve page order.
6. There is no extra visible wrapper copy around the newsletter artwork.

## System architecture

- **HighLevel:** execution/sending layer and scheduled email runtime.
- **Supabase:** source of truth for campaign state, consent/suppression, sender routing, ramp state, tracking, QA evidence, and receipts.
- **GitHub:** versioned operating standard/specification.
- **ChatGPT tasks/automations:** not the scheduler for the newsletter program.

## Sender isolation

Keep each entity's sender, audience, consent, tracking, attribution, and reporting separate.

Approved exception:
- ICONIC LIVE / Nightmare on Channelside may send through The Kollective sender when authorized.
- This sender exception does **not** authorize audience sharing or attribution blending.

## Volume/ramp rule

A 10-recipient send is a batch, not a daily limit. Daily volume is controlled by the active ramp and provider/deliverability health. Batch execution must preserve consent, suppression, deduplication, and entity isolation.
