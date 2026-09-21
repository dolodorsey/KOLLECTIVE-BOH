# BODEGA Promo Code Policy

## Scope
This policy applies only to **Bodega Bodega Bodega** and its verified Shopify store.

Canonical private source of truth:
- Supabase project: `KOLLECTIVE BOH`
- Entity: `enterprise_directory_records.entity_key = bodega-bodega-bodega`
- Metadata key: `promo_code_directory`

The exact private/internal code strings are intentionally **not stored in this public repository**.

## Naming standard
All promo codes must be:
- **ONE WORD**
- Easy to say
- Easy to type
- Easy to remember
- Easy to share verbally

Do not use hyphens, random character strings, long prefixes, or machine-looking codes.

Personal referral codes should default to the person's first name, public handle, nickname, or another approved one-word alias. If a collision exists, use a short one-word alternative rather than a long random suffix.

## Active tier structure

| Tier | Discount | Intended use | Visibility |
|---|---:|---|---|
| Partner | 80% | Approved operating/brand partners | Restricted Shopify segment |
| Team | 75% | Internal Kollective team | Restricted Shopify segment |
| Ambassador | 75% | Approved ambassadors for personal/internal use | Restricted Shopify segment |
| Employee | 50% | Employees/staff | Restricted Shopify segment |
| Friends & Family | 40% | Approved friends/family | Restricted Shopify segment |
| VIP | 30% | Repeat purchasers | Restricted Shopify segment |
| Referral | 25% | Referral conversion | Shareable / trackable |
| Winback | 20% | Customers with prior orders and no purchase in 90+ days | Restricted Shopify segment |
| Welcome | 15% | First purchase | Restricted Shopify segment |
| Promo | 10% | Broad campaign promotion | Public |

## Operating rules
1. Do not publish Partner, Team, Ambassador, Employee, or Friends & Family codes.
2. High-discount codes must also be protected by Shopify customer eligibility; secrecy alone is not sufficient.
3. Rotate any 75–80% code immediately if it appears publicly or is shared outside its intended audience.
4. Use unique ambassador/referral codes when attribution, commissions, or performance tracking matter. The shared ambassador tier is a benefit code, not the preferred attribution system.
5. Keep each brand/store isolated. Do not reuse BODEGA codes for STUSH, FĚNYX, concert merch, or any other Kollective entity.
6. No standing 100% COMP code. Complimentary orders should be manager-approved and handled as a controlled order/draft-order exception.
7. Supabase is the canonical internal directory; Shopify is the execution layer.

## Current system state
- Core BODEGA promo codes are live in Shopify under the one-word naming standard.
- Partner, Team, Ambassador, Employee, and Friends & Family discounts are restricted by tag-driven Shopify customer segments.
- Winback eligibility is defined as at least one prior order with last order 90+ days ago.
- Individual team referral codes are one-word personal names and are stored privately in Supabase.
- HighLevel is internally mapped through the verified BODEGA canonical alias; live provider write/search remains blocked until the connector has the required company/location scope.

## Verification
The current BODEGA promo system was created, corrected to the one-word naming standard, segment-restricted, and mirrored into the private Supabase directory on 2026-09-21.
