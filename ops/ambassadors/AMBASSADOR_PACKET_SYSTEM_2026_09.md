# Ambassador Packet System - 2026.09

## Scope
Independent ambassador systems for:
- STUSH
- FENYX
- Infinity Water
- PRONTO Energy
- OTINI (21+)
- CASA CANTINA (21+)
- ICONIC LIVE Halloween / Nightmare on Channelside

Brands stay isolated. A person may participate in multiple programs, but each membership, agreement, code, tracking link, commission model, posting plan, and referral is program-specific.

## Packet standard
Every external brand packet contains:
1. Welcome letter + about the brand
2. Program expectations
3. 30-day Instagram launch schedule
4. FTC disclosure / truth-in-advertising controls
5. Personalized commission + promo/tracking code sheet
6. Link + QR section
7. One + One referral requirement
8. NDA / confidentiality
9. Category exclusivity / non-compete section
10. Optional post-term restrictive covenant rider - OFF by default until counsel approves jurisdiction/scope
11. Non-solicit / anti-circumvention
12. Content ownership + usage rights
13. Termination / brand safety
14. Onboarding checklist
15. Signature page

OTINI and CASA additionally require 21+ audience/market controls and alcohol advertising compliance.

## Verified public targets
- STUSH: https://stushusa.com
- FENYX: https://fenyx-gules.vercel.app
- Infinity Water: https://watertoinfinity.com
- PRONTO Energy: https://prontoenergydrink.com
- ICONIC LIVE: https://iconic-atl.com
- OTINI: public launch link pending; protected preview must not be distributed
- CASA CANTINA: public launch link pending; protected preview must not be distributed

## Brand heritage control
Do not invent European country-of-origin or founding claims. Current verified enterprise records do not contain an approved origin story for these brands. Packet templates use `origin_story_status=unverified_do_not_publish` until founder/legal approves exact language.

## Compensation control
External packets never auto-invent a percentage. Exact economics live in the personalized compensation sheet and require approval.

Recommended internal starting points (NOT activated):
- STUSH: 15% eligible net web sales; proposed 10% customer code
- FENYX: 15% eligible net web sales; proposed 10% customer code
- Infinity Water: 12% eligible net direct sales; proposed 10% customer code if margins support
- PRONTO: 12% eligible net direct sales; proposed 10% customer code if margins support
- OTINI/CASA: tracking code immediately; default to approved flat campaign/content fee until market-specific alcohol review approves any sales-based compensation/consumer offer

## One + One referral loop
Every activated ambassador/partner is asked to submit one qualified recommendation within 7 days.
- Referral does not auto-approve the referred person.
- The referred person enters the same qualification/agreement process.
- Referral bonus/override is only active when written into the compensation sheet.
- Backend table: `growth_ambassador_referrals`.

## ICONIC LIVE Halloween role separation
Separate addenda:
- Promoter
- Model
- Podcast Partner
- DJ - Performance Set
- DJ - Promo Only
- Host - Stage / Performance
- Host - Promo Only

Performance and promotion must not be conflated. Promo-only DJ/host partners may not publicly imply a booked set or stage-host role.

## Supabase source of truth
New production tables:
- `growth_ambassador_packet_templates`
- `growth_ambassador_program_links`
- `growth_ambassador_referrals`
- `growth_ambassador_role_profiles`

Existing tables retained:
- `growth_ambassador_programs`
- `growth_ambassador_members`

RLS is enabled with no public policies by design. Service/admin workflows access these records.

## GHL deployment spec
When HighLevel connector authorization is restored, create/use program-specific pipelines and do not mix subaccounts.

### Pipeline stages
1. Prospect
2. Qualified
3. Approved
4. Agreement Sent
5. Agreement Signed
6. Onboarding
7. Code + Tracking Link Issued
8. First Post Scheduled
9. First Post Live
10. First Attributed Sale / Ticket
11. Active
12. Paused
13. Offboarded

### Required custom fields
- Ambassador Brand
- Ambassador Role
- Social Handle
- Audience City / Primary Market
- Audience Age Fit
- 21+ Verified (alcohol only)
- Agreement Version
- NDA Signed
- Exclusivity Rider Active
- Promo Code
- Tracking Link
- Personal QR URL
- Commission Model
- Commission Rate / Per-Ticket Amount
- Payout Cadence
- Referred By
- One + One Referral Submitted
- Referral Candidate Handle
- First Post Due
- First Post Live
- Content Approval Status
- Last Attributed Revenue
- Lifetime Attributed Revenue
- Commission Payable
- Payment Status

### Automation sequence
- Approved -> generate/send personalized packet.
- Agreement Signed -> issue code + link + personal QR.
- +3 days -> verify first content is scheduled.
- +7 days -> if no referral, request One + One referral.
- Before every required post -> content approval reminder.
- After attribution -> update revenue/commission ledger.
- Payout window -> send statement, mark paid only after finance confirmation.
- Offboard -> disable code/offer as appropriate, revoke private links, preserve reporting history.

## Status as of 2026-09-18
- Packet files generated and visually QA'd as DOCX + PDF.
- Supabase schema + packet/link/role registry deployed.
- Vercel used to verify public destinations.
- HighLevel connector currently returns IAM/scope 401 on both connected links, so no CRM mutation is being claimed.
