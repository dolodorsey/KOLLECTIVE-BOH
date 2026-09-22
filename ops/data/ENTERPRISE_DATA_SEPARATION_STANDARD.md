# Enterprise Data Separation Standard

Status: LOCKED / ACTIVE  
Effective: 2026-09-22

## Founder directive

All companies are **100% separate companies**.

The enterprise has a very large shared data estate, and every company should progressively use that data in full over time — but always through company-specific classification, segmentation, routing, CRM, sender identity, pipelines, sequences, attribution, reporting, and suppression.

## Core principle

**Shared data resource does not mean shared company identity.**

The Kollective data estate is the source universe.

Each company independently decides which records are relevant to it, materializes those records into its own operating stack, and builds its own relationship history over time.

## Required company separation

Every company maintains its own:

- entity identity
- GHL location
- sender identity / transport
- subscriber/contact materialization
- campaign history
- pipeline(s)
- workflow(s)
- sequence(s)
- CTA destinations
- conversion tracking
- attribution
- suppression / unsubscribe state
- reporting
- performance metrics
- warmup state
- lifecycle history

No company should inherit another company's branding, attribution, or CRM history just because both records originated from the same enterprise data estate.

## Full-data-over-time model

The entire enterprise data estate should be treated as a long-term source universe.

For each company:

1. Continuously inspect the full enterprise data pool.
2. Classify records for company relevance.
3. Assign relevant records to that company independently.
4. Materialize those records into the company's exact GHL location and canonical tables.
5. Start company-specific lifecycle / newsletter / outreach history.
6. Keep learning from behavior and reclassify over time.
7. Expand the company's usable audience as more records become relevant.
8. Preserve global and company-specific DND, unsubscribe, bounce, complaint, and suppression controls.

A company's current exact-location contact count is **not** its permanent audience ceiling.

## Subscriber inheritance

Founder-established preloaded contacts are existing enterprise subscribers.

Those subscribers may be progressively segmented into owned-company / product lanes where relevance exists.

This does **not** mean every subscriber should receive every company's message.

Use:
- source
- geography
- product interest
- event interest
- purchase / attendance
- engagement behavior
- existing relationship
- company fit
- lifecycle stage
- category / industry
- explicit tags and classifications

to determine which companies should receive that subscriber.

## Cold data

Newly sourced cold data is different from the founder-established preload subscriber universe.

Cold records must go through the company's normal eligibility, consent, compliance, and contact rules before newsletter enrollment.

Do not convert scraped or unrelated data into subscribers merely because it is stored inside the enterprise data estate.

## Newsletter behavior

A company newsletter uses:
- that company's audience
- that company's sender
- that company's sequence
- that company's CTA
- that company's pipeline
- that company's reporting

Approved sender exceptions do not authorize audience or attribution merging.

Example: ICONIC LIVE may use The Kollective email transport when explicitly authorized, while remaining a separate ICONIC campaign, audience, tracking, pipeline, and report.

## Data architecture target

**One enterprise data lake → many independent company operating graphs.**

Data can be reused by relevance.

Company identity cannot be merged.
