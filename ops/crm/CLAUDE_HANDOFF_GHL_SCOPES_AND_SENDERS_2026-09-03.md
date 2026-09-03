# Claude Handoff — GHL PIT Permissions + Sender Identities

## Scope boundary

Claude owns only the external/admin changes in this handoff. ChatGPT retains CRM architecture, pipeline deployment, Conversation AI deployment, messaging programs, routing, activation, QA, ClickUp execution binding, and production burn-in.

## 1. HighLevel PIT permissions

Use the existing exact per-location Private Integration for each entity. Do not cross-use credentials and do not rotate tokens unless HighLevel itself requires it.

### Add `pipelines.create` to all 26 active non-beverage entity PITs

Verification: run an intentionally invalid-body request against `POST /opportunities/pipelines`. The desired authorization proof is HTTP 400/422. HTTP 401/403 means still blocked. Do not create a test pipeline.

### Add Conversation AI agent-management/write permission to these 14 PITs

- BARE
- BODEGA
- Brand Studio
- Clean Cut Landscaping
- Consultations
- Courses
- Frequency Productions
- Hakuna Matata
- Halloween General
- Halloween Women
- Halloween Sexy Women
- Mission 365
- Synergy Sounds
- Umbrella Auto Exchange

Verification: intentionally invalid-body request to `POST /conversation-ai/agents`; desired result HTTP 400/422 rather than 401/403. Do not activate or create test agents.

## 2. Dedicated sender identity remediation

The following 12 entities remain externally gated:

- BARE — verified custom domain `bare-essentials.shop`; create/verify real mailbox and email DNS/auth.
- Help 911 — verified owned domain `help911.help`; planned mailbox identities exist but must be created/connected and authenticated.
- Clean Cut Landscaping — resolve owned sender domain + mailbox.
- Consultations — resolve owned sender domain + mailbox.
- Courses — resolve owned sender domain + mailbox.
- Frequency Productions — Vercel site exists but no custom sender domain is verified.
- Hakuna Matata — resolve owned sender domain + mailbox.
- Halloween General — Vercel-only site; resolve custom sender domain + mailbox.
- Halloween Women — Vercel-only site; resolve custom sender domain + mailbox.
- Halloween Sexy Women — Vercel-only site; resolve custom sender domain + mailbox.
- Mission 365 — Vercel-only site; resolve custom sender domain + mailbox.
- Synergy Sounds — Vercel site exists but no custom sender domain is verified.

Sender-ready means the mailbox actually exists and outbound authentication is configured/verified. Do not invent `hello@...` or `info@...` addresses and mark them ready based only on domain ownership.

## Do not touch

- 599 canonical pipeline definitions or deployment queue
- 184 canonical Conversation AI assets
- 158 messaging programs
- 632 email steps
- 78 canonical routes
- agent/route activation modes
- suppression/consent controls
- source triggers
- ClickUp routing
- BEVCO/beverage entities

## Completion receipt

Return one table:

| Entity | Location ID | pipelines.create | Conversation AI manage | Sender domain | Mailbox | SPF/DKIM | DMARC | Production sender | Blocker |
|---|---|---|---|---|---|---|---|---|---|

Do not include tokens or secrets.

## Tracking

- GitHub Issue #9 — Claude handoff/admin work
- GitHub Issue #10 — ChatGPT post-Claude deployment + burn-in
- GitHub Issue #8 — original native GHL scope remediation record
