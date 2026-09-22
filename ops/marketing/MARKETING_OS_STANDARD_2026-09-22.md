# Marketing OS Standard — 2026-09-22 v2

## Purpose
Every active focus entity must have a complete, brand-isolated marketing system stored in Supabase and executable through the correct provider accounts.

## Required marketing lanes
1. Social publishing
2. Engagement
3. DMs
4. Comments
5. Email outreach / lifecycle
6. Shopify Email when applicable
7. SMS / event channels when applicable

### Engagement is not comments or DMs
- Engagement = proactive relationship-building: likes, saves, story reactions/replies, creator/partner/customer interaction.
- Comments = public conversation on owned and relevant third-party posts.
- DMs = private inbound response, qualified outbound follow-up, partnership/provider/customer conversion.

## Required fields per entity
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
- automation_plan
- status, owner/POC, conversion path, KPIs, cadence, approval mode, segmentation, compliance

## App standard
Applies to Good Times, S.O.S., Mission 365, On Call, and Luxe on Demand.

### Social
5–7 feed/reel posts weekly plus daily stories. Content must include demos, use cases, social proof, partner/provider stories, feature education, and conversion CTAs.

### Engagement
Two focused blocks Monday–Saturday. Target high-relevance local users, providers, partners, creators, venues/community pages, recent followers, and warm prospects. No generic engagement farming.

### DM
Inbound SLA: within 2 business hours. Qualified outbound/follow-up is relationship-first, human-approved, CRM logged, and limited to relevant audiences.

### Comments
Reply to meaningful owned-post comments within 2 business hours. Add contextual public comments on relevant accounts. Sales intent routes to CRM; support/safety issues route to the correct owner.

### Email lifecycle
Broadcasts alone are insufficient. Required lifecycle flows:
- welcome/value promise
- signup/install activation
- incomplete onboarding
- first-action education
- feature/use-case education
- social proof
- inactive 7-day reactivation
- inactive 30-day win-back
- referral/invite
- major release/launch

Suggested GHL stages:
New Lead → Engaged → Signup → Onboarding → Activated → Retained → At Risk → Reactivated → Referral.

### Shopify Email for apps
Not a default app lifecycle provider. It can activate only when the app has its own dedicated consented Shopify segment and correct brand sender. Never borrow STUSH/FĚNYX audiences.

## Retail / Shopify standard
STUSH and FĚNYX use brand-specific Shopify segments even though the commerce backend may be shared.

Required Shopify flows:
- welcome
- browse abandonment
- cart abandonment
- checkout abandonment
- post-purchase
- review/UGC request
- cross-sell
- win-back
- VIP retention
- drop/restock broadcasts

## Event standard
ICONIC uses an event-cycle system: artist heat, event experience, urgency, social proof, city culture, behind-the-scenes, sponsors/merch, and direct ticket CTA. Shopify Email is event-driven for correctly tagged event-merch/customer segments only.

## Beverage standard
BEVCO and each beverage brand have separate marketing records. Core audiences include consumers, hospitality accounts, retail buyers, distributors, creators, and event partners. Alcohol brands require 21+ audience/platform/legal compliance.

## Source of truth
- Strategy: public.company_annual_plans
- Executable channel definition: public.company_channel_plans
- Content execution: public.growth_content_operations
- Campaigns: public.marketing_native_campaigns
- Sender state: public.communication_sender_profiles
- Send receipts: public.communication_send_log
- CRM: HighLevel entity-specific location/pipeline when connector scope is available

## Current verified focus coverage
25 focus/entity plans were verified with all six core lanes stored:
social_post, engagement, dm, comment, email_outreach, shopify_email.

## GHL deployment truth from internal mirror
Deployed / native pipeline IDs present:
- Good Times
- Mission 365
- S.O.S.
- Casper Group
- STUSH
- Sole Exchange
- The Kollective

Partially deployed / remediation still required:
- On Call

Blocked or not certifiable live yet:
- FĚNYX — exact location PIT missing
- ICONIC — entity remediation required
- BEVCO INTL — scope currently validation-only
- Luxe on Demand — scope currently validation-only
- Mister Manufacturing — pending scope probe
- The Kollective Entertainment — no certified deployment row found in the current focus dashboard

## Known execution blockers
- Direct HighLevel resource search currently returns connector IAM 401, so live provider re-verification from this session remains blocked even where internal deployment receipts exist.
- Mission 365: social identity + email sender setup required even though pipelines are deployed.
- Luxe on Demand: social identity + email sender setup required.
- S.O.S.: email sender setup required.
- Several beverage brands have strategy stored but sender/provider setup still required.
- Privé Vodka and XXX Vodka also need social identity/account mapping before execution can become active.

## Non-negotiables
- No cross-brand audience mixing.
- No borrowed sender identity.
- Marketing consent/suppression rules apply.
- Social engagement must be contextual; no bot-like mass activity.
- Provider receipts are required before claiming sends/posts executed.
