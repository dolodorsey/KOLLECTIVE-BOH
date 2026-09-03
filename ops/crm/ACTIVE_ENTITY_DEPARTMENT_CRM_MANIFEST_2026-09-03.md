# Active Entity Department CRM Manifest

Date: 2026-09-03
System of record: KOLLECTIVE BOH / Supabase
CRM target: HighLevel
Code/source mirror: KOLLECTIVE-BOH

## Scope

Included active CRM deployment scope:
- Casper Group
- Good Times
- S.O.S.
- Mission 365
- Help 911
- Dr. Dorsey
- Hakuna Matata
- STUSH
- Bare
- Clean Cut Landscaping
- Frequency Productions
- Synergy Sounds
- Sole Exchange
- On Call
- BODEGA
- Halloween General
- Halloween Women
- Halloween Sexy Women
- Make Atlanta Great Again — Merchandise
- Courses
- Consultations
- The Kollective
- Brand Studio
- The Mind Studio
- Umbrella Auto Exchange
- The People's Dept.

Explicitly excluded from this sprint:
- Beverages
- Rose on Piedmont
- ICONIC / active concert properties
- Water Portfolio
- Playmaker's Sports Association

## Department Architecture

The CRM operating layer maps into the existing 15 canonical enterprise departments rather than creating a competing org chart:

1. Executive Strategy & Command
2. Growth & Marketing
3. Sales, Partnerships & Revenue
4. Customer, Member & Community
5. Operations & Fulfillment
6. Product, Brand & Experience
7. Creative, Media & Content Studio
8. People, Talent & Training
9. Finance, Treasury & Controls
10. Procurement & Vendor Management
11. Technology, Data & Automation
12. Legal, Compliance & Risk
13. Security, Intelligence & Resilience
14. Capital, M&A & Expansion
15. Events & Activations Command

Department-level pipeline families now include content production, campaign production, audience growth, outbound outreach, creators/ambassadors, sales conversion, business development, partnerships, sponsorships, customer success, community, fulfillment, project management, executive exceptions, product development, ecommerce merchandising, PR/media, recruiting, A/R, vendor procurement, data/CRM, automation delivery, compliance review, incident resilience, and capital/expansion.

Each pipeline spec contains stages, funnel path, workflow rules, SLA, handoff rules, KPI set, owner role, and PM role.

## Deployment Waves

### Wave 1 — Critical
- Casper Group
- Good Times
- S.O.S.
- Mission 365
- Help 911
- Dr. Dorsey
- Hakuna Matata

### Wave 2 — High
- STUSH
- Bare
- Clean Cut Landscaping
- Frequency Productions
- Synergy Sounds
- Sole Exchange
- On Call

### Wave 3 — High
- BODEGA
- Halloween General
- Halloween Women
- Halloween Sexy Women
- Make Atlanta Great Again — Merchandise
- Courses
- Consultations

### Wave 4 — Enterprise / Support
- The Kollective
- Brand Studio
- The Mind Studio
- Umbrella Auto Exchange
- The People's Dept.

## Wave 1 Entity-Specific Pipelines

### Casper Group
- CASPER GROUP | LOCATION ACQUISITION
- CASPER GROUP | FRANCHISE / LICENSING
- CASPER GROUP | CATERING SALES
- CASPER GROUP | VENDORS / SUPPLIERS
- CASPER GROUP | STRATEGIC PARTNERSHIPS

### Good Times
- GOOD TIMES | USER ACQUISITION
- GOOD TIMES | BUSINESS LISTINGS
- GOOD TIMES | ADVERTISING SALES
- GOOD TIMES | CONCIERGE PARTNERS
- GOOD TIMES | RESERVATIONS / EXPERIENCES

### S.O.S.
- SOS | PROVIDER RECRUITMENT
- SOS | SERVICE REQUESTS
- SOS | ENTERPRISE ACCOUNTS
- SOS | REFERRAL PARTNERS

### Mission 365
- MISSION 365 | MISSION ORGANIZERS
- MISSION 365 | VOLUNTEERS / USERS
- MISSION 365 | CORPORATE SPONSORS
- MISSION 365 | NONPROFIT PARTNERS

### Help 911
- HELP 911 | INCIDENT / CLIENT INTAKE
- HELP 911 | ATTORNEY / PROVIDER PARTNERS
- HELP 911 | POLICE REPORTS
- HELP 911 | ENTERPRISE PARTNERSHIPS

### Dr. Dorsey
- DR DORSEY | CONSULTING
- DR DORSEY | SPEAKING
- DR DORSEY | MEDIA / PRESS
- DR DORSEY | BRAND PARTNERSHIPS
- DR DORSEY | AUDIENCE / VIP

### Hakuna Matata
- HAKUNA MATATA | READER ACQUISITION
- HAKUNA MATATA | BULK BOOK SALES
- HAKUNA MATATA | BOOK TOUR / SPEAKING
- HAKUNA MATATA | RETAIL / DISTRIBUTION
- HAKUNA MATATA | PARTNERSHIPS

## Supabase Tables

Canonical CRM operating layer:
- public.crm_department_templates
- public.crm_entity_department_matrix
- public.crm_entity_pipeline_manifest

Existing supporting systems reused instead of duplicated:
- public.enterprise_departments
- public.growth_pipeline_slas
- public.growth_programs
- public.brand_conversion_configs
- public.ghl_entity_mappings
- public.ghl_location_readiness
- public.integration_entity_bindings
- public.integration_command_outbox
- public.marketing_tracking_links
- public.growth_automation_playbooks

## Object Naming Standard

Every HighLevel object must remain entity-owned:

- Pipeline: `ENTITY | PIPELINE NAME`
- Workflow: `ENTITY | PIPELINE | TRIGGER/ACTION`
- Form: `ENTITY | FORM PURPOSE`
- Funnel: `ENTITY | FUNNEL PURPOSE`
- Tag: entity-prefixed slug
- Custom field: entity-prefixed slug

No cross-brand contact pooling, sender reuse, opportunity mixing, or generic enterprise pipelines unless explicitly approved.

## HighLevel Deployment Status

Wave 1 pipeline specifications are ready in Supabase, but HighLevel live provisioning is blocked by the current connected-app IAM scope. Current connector response:

`401 — This authClass type is not allowed to access this scope. Please verify your IAM configuration.`

The seven Wave 1 HighLevel bindings currently report `needs_credentials`. Supabase manifest rows therefore use `ghl_status = blocked_iam` so the deployment queue is explicit and auditable rather than silently incomplete.

Once IAM scope is restored, provision in this order:
1. verify entity location/subaccount
2. create/update custom fields and tags
3. create pipelines and stages
4. create forms/funnels/calendars
5. create workflows and SLA timers
6. connect entity-scoped contacts
7. validate attribution/reporting
8. run end-to-end QA
9. set `ghl_status = deployed`

## Executive Rule

No active opportunity may remain in an open stage without an accountable owner, entity PM, next action, next-action date, SLA, source/campaign attribution, expected value where applicable, and an exit condition.
