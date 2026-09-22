# GHL Runtime Repair — 2026-09-22

## Scope
ICONIC LIVE / Nightmare on Channelside HighLevel runtime truth repair.

## Verified state
- ICONIC LIVE parent location: `rlQrPJzNgIauNFkZ2equ`
- Nightmare event location: `BzWF8vhGoYIIXou6wgFg`
- Exact ICONIC LIVE PIT is stored in Supabase and verifies against the parent location.
- Verified capabilities on ICONIC LIVE PIT:
  - location identity: authorized
  - contacts read: authorized
  - contacts write: authorized via validation-only probe
  - conversations read: authorized
  - pipelines read: authorized
  - pipelines create: **scope missing**
- The ChatGPT HighLevel connector IAM 401 is not a backend credential blocker and must not be used as canonical runtime truth.
- Incorrect Gateway mapping `concert-tampa-halloween -> O8K7aK7OfVB1Gaquu2FF` was disabled after provider identity resolved that token to KOLLECTIVE HOSPITALITY rather than the Nightmare event location.
- The event subaccount `BzWF8vhGoYIIXou6wgFg` currently has agency-level identity visibility but no exact location PIT in the indexed credential registries.

## Runtime changes
1. `ghl-runtime-truth-export-v1`
   - probes `pipelines.create` separately from pipeline read
   - never returns provider secrets
2. `ghl-runtime-truth-sync-v1`
   - supports targeted `entity_keys`
   - can self-heal previously inactive runtime rows when an exact PIT verifies
   - does not confuse pipeline read access with pipeline-create authorization
   - keeps deployment queues blocked specifically on `pipelines.create` when that scope is missing

## Canonical rule
Credential health, location identity, and capability scope must be derived from direct provider probes using Supabase-held credentials. Connector IAM failures are connector-specific evidence only.

## Remaining action
Edit the ICONIC LIVE Private Integration in HighLevel and add the `pipelines.create` scope. HighLevel documents that existing Private Integration scopes can be edited without rotating the token. After scope update, rerun the targeted runtime truth sync and then release the pipeline deployment queue.
