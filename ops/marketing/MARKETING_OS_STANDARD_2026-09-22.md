# Marketing OS Standard — 2026-09-22 v3

## Scope
Current marketing focus excludes On Call, Luxe on Demand, and Mister Manufacturing. Their existing plans remain stored but their current marketing channel plans are paused.

The current certified focus set contains 30 entity/brand records. Each must remain isolated by entity ID, social identity, sender route, audience, tracking, CRM pipeline, execution receipt, and reporting.

## 12 required marketing lanes
Every current focus entity must have all 12 lanes defined, even when a lane is explicitly not used or setup-required.

1. Social publishing
2. Engagement
3. DMs
4. Comments
5. Email outreach / lifecycle
6. Shopify Email when applicable
7. Direct outreach
8. Creator / ambassador outreach
9. Partnership outreach
10. Paid media
11. Retargeting
12. Referral / retention

Additional event/SMS channels may be layered on where applicable.

## Engagement separation
- Publishing = owned content distribution.
- Engagement = proactive relationship-building: likes, saves, story reactions/replies, priority-account interaction.
- Comments = public conversations.
- DMs = private conversations and follow-up.
- Direct outreach = researched outbound to qualified people/accounts.
- Creator outreach = creator/ambassador acquisition and activation.
- Partnership outreach = B2B/strategic relationship development.

These cannot be collapsed into one generic "social" task.

## Required plan fields
- annual objective
- first 90 days
- quarterly plan
- weekly scorecard
- team meeting plan
- social_plan
- engagement_plan
- dm_plan
- comment_plan
- email_plan
- shopify_email_plan
- outreach_plan
- creator_plan
- partnership_plan
- retention_plan
- paid_media_plan
- reporting_plan
- automation_plan
- status / POC / conversion path / KPIs / cadence / approval / compliance

## Current certification
Verified in Supabase after v3 backfill:
- Focus records: 30
- 12/12 stored plan lanes: 30/30
- 12/12 executable channel definitions: 30/30
- Engagement target layer populated: 30/30
- Active full-funnel growth program: 30/30

A plan is not equivalent to provider readiness. Any setup-required provider/account/sender lane must have an open company_execution_queue remediation item.

## Social identity hard gate
Social identity is an execution invariant, not an agent suggestion.

Before an Instagram publish:
1. Resolve the exact entity and canonical handle.
2. Resolve the exact social account and connected account.
3. Verify numeric Instagram external account ID.
4. Load the exact account credential.
5. Read the live profile from Meta.
6. Normalize live Meta username and directory username.
7. If usernames do not match, fail closed BEFORE creating a media container.
8. Disable/quarantine the stale route.
9. Write an audit receipt.
10. Require identity reconciliation before future publishing.

No provider username match = no publish.

## S.O.S. identity correction
Founder correction, 2026-09-22:
- Current S.O.S. Instagram: @SUPERHERO.ONSTANDBY
- The live account currently @SUPERHERO.ONSTANDBY is the account formerly known as @ROSEONPIEDMONT / @THEROSEONPIEDMONT.
- The former Rose route is therefore an S.O.S. identity lineage, not a current Rose publishing route.
- Rose social publishing is blocked until a distinct current Rose Instagram account is verified.
- A second conflicting S.O.S. database identity was quarantined and cannot publish.

The canonical current S.O.S. provider account uses Instagram external account ID 17841456987375604.

## Social incident root cause
A Rose content package was published through a database route labelled Rose. During the publish, the Meta profile read returned the live username superhero.onstandby and the executor calculated username_matches_directory=false.

The executor stored that mismatch but did not abort. It proceeded to create and publish the media container. This was a hard-gate failure at the final execution adapter.

The fix is in MCP Gateway social-publish-executor v9:
- live username mismatch is now a pre-publish hard failure
- stale account is disabled
- audit event is written
- no media container is created

This is why additional agents alone did not prevent the incident: upstream agents were advisory/QA layers, while the irreversible provider executor did not enforce the identity invariant.

## App standard
Current app marketing focus: Good Times, S.O.S., Mission 365.

Good Times, S.O.S., and Mission 365 remain launch-gated until public listing and promotion QA are verified. Prelaunch CTA stays on launch updates/waitlist language until the gate passes.

Required app lifecycle:
- welcome/value promise
- signup/onboarding
- activation
- incomplete onboarding recovery
- feature/use-case education
- social proof
- inactive 7-day reactivation
- inactive 30-day win-back
- referral/invite
- release/launch communication

## Email sender truth
- Good Times: connected exact sender route.
- S.O.S.: certified exact-location sender reply@mail.superherosonstandby.com with reply-to help@thesuperherosonstandby.com.
- Mission 365: exact HighLevel location delivery is verified. Dedicated Mission 365 sender remains an upgrade, not a blocker.
- ICONIC: founder-approved explicit parent transport route through The Kollective Gmail. Audience, creative, CTA, tracking, and attribution remain ICONIC-only.
- Infinity Water and Pronto Energy: connected brand sender profiles.
- Other sender profiles remain setup-required until verified; they must not be marked executed without provider proof.

## Shopify / retail
STUSH and FĚNYX use brand-specific Shopify segments even when sharing commerce infrastructure.

Required Shopify lifecycle:
- welcome
- browse abandonment
- cart abandonment
- checkout abandonment
- post-purchase
- review/UGC
- cross-sell
- win-back
- VIP retention
- drop/restock

## BEVCO
BEVCO and each beverage brand keep separate plans and audiences.

Full funnel includes:
- consumer demand
- hospitality/on-premise placements
- retail buyers
- distributors
- events/activations
- creator advocacy
- account reorders
- retargeting
- retention

Alcohol brands require 21+ audience/platform/legal compliance.

## Casper Group
Parent and active concepts keep separate brand execution. Full funnel includes:
- local social demand
- food/lifestyle creator engine
- catering and group-order outreach
- property/location pipeline
- office/event relationships
- repeat-visit retention
- local paid/retargeting when ready

## ICONIC
Full funnel includes:
- artist-specific creative
- ticket urgency
- promoters
- micro-influencers
- fan pages
- sponsors
- media
- group sales
- hospitality partners
- ticket-buyer retention
- next-event cross-sell
- merch

## Reporting truth rules
Daily:
- provider publishing receipts
- engagement completed
- DM/comment SLA
- email sends/replies
- outreach touches
- new qualified leads
- provider failures

Weekly:
- qualified reach
- engagement quality
- site/profile traffic
- leads/signups
- email performance
- outreach replies/meetings
- pipeline movement
- conversion
- retention
- revenue / mission KPI
- winning/weak creative
- next experiments

Non-negotiable truth:
- no provider receipt = not executed
- no cross-brand attribution
- do not hide setup blockers
- do not equate lead with qualified lead
- do not let advisory agents override hard execution gates

## Source of truth
- Strategy: public.company_annual_plans
- Executable channels: public.company_channel_plans
- Engagement targets: public.growth_social_engagement_targets
- Full-funnel programs: public.growth_programs
- Content: public.growth_content_operations
- Campaigns: public.marketing_native_campaigns
- Sender profiles: public.communication_sender_profiles
- Send receipts: public.communication_send_log
- Remediation: public.company_execution_queue
- Social provider runtime: MCP Gateway social_accounts / connected_accounts / social-publish-executor

## Non-negotiables
- Separate every brand/entity.
- Exact social identity must be provider-verified.
- Explicit parent sender routes must be recorded, not assumed.
- Consent/suppression rules apply.
- Human approval for outbound relationship actions.
- No generic engagement farming.
- No cold SMS.
- Provider receipts required before claiming execution.
