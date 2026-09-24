# Marketing Drive Content System

**Version:** 2026-09-24.master-drive-content-v1  
**System of record:** Kollective BOH Supabase  
**Canonical publish root:** Google Drive `MARKETING` — `1OjxHeuwZnD6_vI4WOGz8i4BJ61BsR9Ya`

## Purpose

The founder-designated Drive folders are a continuously monitored content library, not one-time uploads. Every discovered asset is tracked from source through review, scheduling, provider execution, and published receipt.

The system must always answer:

1. Have we seen this Drive file before?
2. Which company/brand owns it?
3. What type of content is it?
4. Is it unused, held, approved, scheduled, or actually published?
5. Which content operation used it?
6. Which provider receipt proves publication?
7. Can the asset be reused, repurposed, or must it remain retired/held?

## Founder-Designated Sources

- **MARKETING** — canonical master root and preferred publish source.
- **SOCIAL MEDIA POSTS** — brand/campaign social source tree under MARKETING.
- **GOOD TIMES POSTS** — GOOD TIMES content source under Social Media Posts.
- **DORSEY IG POSTS** — founder social source under Social Media Posts.
- **HALLOWEEN CONCERT / MAIN** — current founder upload dropbox inside the Halloween campaign tree.
- **NEWSLETTERS** — email creative source; never treated as feed graphics without separate social QA.
- **QR CODES / QR CODE W/ DESIGN** — CTA/link support; not standalone feed content by default.
- **ANIMATIONS (Marketing child)** — preferred canonical animation source.
- **External ANIMATIONS folder** — monitored mirror/fallback; copy or stage through canonical media flow before provider publishing.

## Hard Exclusions

Both folders named **DOLO OPTIONS** remain founder-hold content. They are not watched for auto-programming and must not enter a publish queue until the founder explicitly releases them.

Legacy/idea/archive folders may be indexed for awareness but are not publish-enabled unless separately cleared.

## Brand Isolation

Every folder and asset inherits or receives an explicit entity/brand mapping. Content, captions, provider jobs, tracking links, receipts, and reporting remain separate by company.

Never use one company’s graphic as another company’s source asset merely because both sit under MARKETING.

## Content Lanes

### Feed / Carousel
Static brand graphics, campaign graphics, event graphics, founder photos, product/lifestyle creative.

### Reels / Stories
Animations, videos, feed repurposes, campaign motion assets.

### Email
Newsletter folders and newsletter graphics. Social repurposing requires new copy and visual QA.

### CTA Support
QR-code graphics, direct-link cards, merch links, ticket links, app/download links.

### Hold / Support
Mockups, ideas, old newsletters, legacy app graphics, DOLO OPTIONS, or assets whose identity/timing is no longer current.

## Asset Lifecycle

`discovered → review → approved → scheduled → published`

Additional states:
- `reusable`
- `hold`
- `blocked`
- `retired`

**Published means provider receipt exists.** A calendar date, execution queue row, or internal schedule does not count as published proof.

## Dedupe Rules

- Primary identity key: **Google Drive file ID**.
- A repeated file surfaced through overlapping folder roots is one asset.
- Same filename alone never establishes identity.
- Normalized filename + MIME type may flag a duplicate candidate, but visual/content QA is required before treating separate Drive IDs as the same creative.
- Never schedule a previously published asset by accident.
- Intentional reuse must create a new content operation and record the reuse reason/campaign.

## Continuous Scan Workflow

Every scan cycle:

1. Read the registered watched folders.
2. Discover current direct-child assets and relevant nested brand folders.
3. Upsert by Drive file ID into the asset ledger.
4. Preserve existing scheduled/published history.
5. Classify new assets by brand, content lane, and source role.
6. Flag unknown brand assignments, legacy sources, duplicate candidates, and hold folders.
7. Compare unused inventory against each brand’s channel cadence.
8. Select the next appropriate assets.
9. Perform visual QA and factual/tag QA.
10. Build captions, verified account tags, native media tags when applicable, CTA, and story-repurpose metadata.
11. Stage private Drive media onto a provider-fetchable delivery URL.
12. Register exact media + caption QA.
13. Create the provider schedule/job.
14. Record the provider job ID back in Kollective OS.
15. On provider success, attach the receipt/permalink and mark the asset effectively published.

## Supabase Sources of Truth

### Folder Registry
`public.marketing_drive_folders`

Tracks:
- Drive folder ID / URL
- parent/root relationships
- brand/entity
- source role
- content lane
- watch/publish permissions
- scan timestamps/counts
- folder-specific rules

### Asset Ledger
`public.marketing_drive_assets`

Tracks:
- Drive file ID
- source folder
- filename / MIME
- brand/entity
- lifecycle
- first/last seen
- scheduling and publishing references
- content operation / receipt linkage

### Lifecycle View
`public.v_marketing_drive_asset_lifecycle`

Computes current truth using:
- `growth_content_operations`
- `social_execution_receipts`

Provider receipt truth overrides internal schedule state.

## Initial Inventory Snapshot — 2026-09-24

- **87 registered source folders**
- **85 watched folders**
- **1,217 indexed assets**
- **1,055 discovered/unused**
- **64 scheduled**
- **7 review**
- **91 hold/support/archive**

Some Drive folders returned the API’s 100-item cap during the first inventory, so these numbers are a starting snapshot, not a claim that no deeper items exist.

## Major Content Pools Identified

- GOOD TIMES: nightlife, promos, weekly/event guides, general content.
- DORSEY: RAW photos, quote graphics, STUSH collabs, Mini-Me, Print Warehouse, Hakuna parables, BEVCO BTS.
- ICONIC / Nightmare on Channelside: campaign, artist, ticket, poster, fan, opening-act, merch-related creative.
- STUSH: editorial posts, day-in-life, products/mockups, newsletter.
- FĚNYX: flyers/capsules, day-in-life, products/mockups, newsletter.
- S.O.S.: provider acquisition/onboarding social graphics.
- Sole Exchange: social graphics + animations.
- BEVCO brands: Infinity, Pronto, ORA, Casa Cantina, Tempo, Noir, XXX, OTINI, Privé, Island Water plus BTS sources.
- Mission 365 and Hakuna Matata content.
- Brand-specific newsletters.
- QR / clickable CTA support library.
- Large animation library spanning enterprise and entity brands.

## Scheduling Standard

The folder watcher does not mean “post everything automatically.”

Selection must respect:
- brand cadence
- campaign timing
- factual freshness
- creative variety
- prior usage
- connected provider status
- visual QA
- verified entity handles/tags
- feed vs Reel vs Story suitability

For accounts with direct Meta publishing, provider scheduling and receipts are the proof layer. If a brand’s provider route is blocked, content can be made fully ready but remains blocked rather than being falsely reported as live.

## HighLevel

HighLevel remains a CRM/newsletter/engagement lane where appropriate. Social provider truth does not fall back to HighLevel merely because a content record exists.

As of the 2026-09-24 setup pass, the direct HighLevel connector in the active session returned an IAM 401 for the requested scope. No direct GHL Social Planner write should be claimed without fresh provider proof.

## Operating Rule

New uploads do **not** require the founder to resend the folder URL. The watched-folder registry is persistent. New assets enter the ledger as `discovered`, remain brand-isolated, and can then be pulled into the correct company’s editorial schedule without losing posting history.
