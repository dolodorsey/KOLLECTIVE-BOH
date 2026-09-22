# Enterprise Subscriber → Owned Product Segmentation Standard

Status: LOCKED / ACTIVE  
Founder directive: 2026-09-22

## Core rule

Contacts that were already preloaded before the 2026-09-22 founder cutoff are existing Kollective-company subscribers.

Moving those existing company subscribers into smaller owned products, apps, brands, events, and content lanes is **audience segmentation inside the same enterprise**, not acquisition of a new cold lead.

## Eligibility

A preloaded contact may be allocated to an owned-product newsletter when:

- the contact existed in the applicable enterprise/GHL inventory on or before the founder cutoff;
- the product/brand is owned by the same Kollective enterprise;
- the contact is assigned into that product lane through an existing product/GHL location, tag, classification, source, or documented segmentation rule;
- the contact has a usable email address;
- the contact is not globally or channel-specifically DND, unsubscribed, suppressed, bounced, or otherwise ineligible.

## Hard protections

- Never override DND or unsubscribe.
- A later unsubscribe wins over the preload inheritance rule.
- Newly sourced cold prospects after the cutoff are **not** automatically subscribers.
- Do not treat scraped contacts, purchased lists, unrelated vendor leads, or another company's data as subscribers.
- Do not merge reporting identities across products; every product retains its own campaign, tracking, attribution, and performance.
- Sender sharing does not imply audience sharing.
- S.O.S. provider-only campaigns still require provider segmentation.
- Event-specific campaigns should use event/product segmentation where available rather than blasting an unrelated segment.

## Good Times implementation

Good Times is an owned product lane with GHL location:

`jbm4vUg0J1llNkK8q6Lt`

The founder-confirmed preload cutoff is:

`2026-09-22T04:45:00Z`

Current Good Times contacts present before that cutoff may be materialized into the Good Times newsletter subscriber audience unless they are DND/suppressed/unsubscribed.

The import is incremental and preserves each GHL contact ID so HighLevel remains the execution layer.

## Runtime architecture

1. Preloaded GHL contact inventory is read from the exact owned-product location.
2. Eligible contacts are written to `newsletter_subscribers` with founder-attested enterprise-subscriber basis.
3. Existing GHL contact IDs are mirrored to `ghl_outreach_contacts`.
4. `newsletter_campaigns` controls the graphic-only email package and schedule.
5. `enqueue_due_ghl_newsletters_v1()` enrolls only eligible subscribers.
6. `gtm_dispatch_approved_ghl_emails_v1()` sends through HighLevel in controlled batches.
7. Provider receipts are reconciled before warm-up volume advances.

## Volume

Ten recipients is a **batch size**, not a daily ceiling.

Active warm-up ladder:

**50 → 75 → 100 → 150 → 250 → 400 → 650 → 1,000/day**

Advancement requires healthy provider/delivery evidence.
