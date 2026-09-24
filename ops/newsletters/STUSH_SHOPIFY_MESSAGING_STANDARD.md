# STUSH Shopify Messaging Standard

Status: ACTIVE CONFIGURATION / PRODUCTION HELD ON SHOPIFY SENDER AUTH  
Effective: 2026-09-24

## Founder directive

STUSH marketing newsletters send **from STUSHUSA.COM through Shopify itself**.

Production provider:

- Shopify Messaging
- Shopify shop: `1tnkwp-vn.myshopify.com`
- shared commerce backend / primary domain: `bodgeaworldwide.myshopify.com`
- STUSH customer-facing brand domain: `stushusa.com`
- sender required: `info@stushusa.com`

GHL is CRM-only for STUSH. It is not the newsletter sender.
Amazon SES is disabled as the STUSH marketing-newsletter route.

## Native Shopify objects

Shopify Messaging installation:
`gid://shopify/AppInstallation/657304879295`

STUSH customer segment:
`gid://shopify/Segment/580298965183`

Segment:
`STUSH | Email Subscribers`

Query:
`email_subscription_status = 'SUBSCRIBED' AND customer_tags CONTAINS 'stush-newsletter'`

## Audience

Enterprise STUSH email pool available in Supabase:
**87,217**

The full pool is queued for native Shopify customer materialization.

Queue source:
`enterprise_master_full_pool_stush_20260924`

Current blocker:
the BODEGA/STUSH backend Admin token is product-write capable but Shopify denies protected customer API. It needs `read_customers` and `write_customers`.

Do not mark the native Shopify audience complete until Shopify customer import receipts prove it.

## Sender authentication gate

Before the first production STUSH newsletter:

1. Shopify Settings → Notifications must use `info@stushusa.com` as the sender.
2. Shopify's supplied sender-domain CNAME records must be added for `stushusa.com`.
3. DMARC must exist for `stushusa.com`.
4. Shopify must show the sender/domain as authenticated.
5. Inbox QA must prove the actual From identity is STUSH / `info@stushusa.com`.

No GHL or Gmail fallback for STUSH marketing newsletters.

## Graphic body standard

The Drive graphic is the newsletter.

Production uses its Shopify CDN copy as the entire visible email body. Never attach the artwork.

Current Shopify CDN assets:

1. Fall Edit  
   `https://cdn.shopify.com/s/files/1/0759/7506/5791/files/stush-newsletter-fall-edit.png?v=1790235481`
2. Field Issue  
   `https://cdn.shopify.com/s/files/1/0759/7506/5791/files/stush-newsletter-field-issue.png?v=1790235487`
3. Raw Material  
   `https://cdn.shopify.com/s/files/1/0759/7506/5791/files/stush-newsletter-raw-material.png?v=1790235493`
4. After Hours  
   `https://cdn.shopify.com/s/files/1/0759/7506/5791/files/stush-newsletter-after-hours.png?v=1790235499`

## Sequence

1. Fall Edit — **SHOP THE DROP**
2. Field Issue — **SHOP NOW**
3. Raw Material — **EXPLORE THE DROP**
4. After Hours — **SHOP AFTER DARK**

Tracked STUSH links are registered in BOH. Production campaigns are packaged and intentionally marked `blocked_sender` until Shopify sender authentication is proven.

## Current truth

- Shopify Messaging: installed
- STUSH brand segment: created
- existing native subscribed customers tagged into STUSH segment: 2
- Shopify segment count: 2
- full STUSH Supabase subscriber pool: 87,217
- native Shopify import queue: 87,217
- backend customer API: blocked by missing customer scopes
- sender `info@stushusa.com`: configured as the required STUSH identity in BOH, not yet proven in Shopify Notifications
- newsletters: ready as Shopify-native packages, held from send until the two Shopify-native blockers above are cleared
