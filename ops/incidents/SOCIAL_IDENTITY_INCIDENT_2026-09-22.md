# Social Identity Incident — 2026-09-22

## Incident
A content operation scoped to The Rose on Piedmont was externally published using a route that the database still identified as @roseonpiedmont.

Meta's live account read during the publish returned the username @superhero.onstandby.

Provider proof:
- BOH social execution receipt: ceb2158e-e0a9-4354-839a-7bb50cb12867
- Content operation: 2999bacc-b934-4d6c-97ed-5500c724fe39
- MCP Gateway publish job: 44f509f9-3fee-4966-92ae-7346cf2f169d
- Provider publish ID: 18177780211429192
- Live Meta username observed: superhero.onstandby
- Directory username at execution: roseonpiedmont
- username_matches_directory: false

## Root cause
The provider executor already performed the correct live Meta profile read and computed the mismatch, but the mismatch was informational only. It was stored in provider_response after the irreversible publish rather than enforced before media creation.

The architecture therefore had multiple upstream agents/policies but no mandatory final identity invariant at the provider boundary.

## Founder correction
@SUPERHERO.ONSTANDBY is the former @ROSEONPIEDMONT account and is now the canonical S.O.S. social route.

Canonical S.O.S. live route:
- social account ID: fe5533bb-9840-4176-b27c-acfd5494f080
- connected account ID: 04447e00-a548-459e-a4b3-f685abf93540
- Instagram external account ID: 17841456987375604
- current username: superhero.onstandby
- former handles: roseonpiedmont / theroseonpiedmont

Conflicting legacy S.O.S. route:
- social account ID: 20e2400f-4e98-4015-9b95-021be4926057
- external account ID: 17841422681928357
- status: connected_but_disabled
- do_not_publish: true

Rose:
- current Instagram identity intentionally unset
- social publishing/engagement/DM/comment execution is blocked
- a distinct current Rose account must be verified before any future publishing

## Permanent guard
MCP Gateway Edge Function social-publish-executor upgraded from v8 to v9.

v9 SHA:
015730183fe156d2ebf0c6e424779a6ca962be039d31549f7fac657cc57c64a3

New behavior:
1. Load exact connected account and credential.
2. Read live Instagram profile from Meta.
3. Compare live username with canonical username.
4. Mismatch => write audit event.
5. Disable stale route.
6. Throw provider_username_mismatch.
7. Stop before createContainer().
8. No media object can be created or published.

## Operating lesson
More agents do not create safety if the final executor can bypass their advice. Irreversible actions require database/provider-level hard gates. Agent QA is defense in depth; it is not the final authority.
