# KHG Foundation Skills — Production Repair Record (2026-10-10)

## Scope and authority
Founder authorized repair of all five foundation controls. Canonical creative source is ONLY the Google Drive MARKETING root `1OjxHeuwZnD6_vI4WOGz8i4BJ61BsR9Ya` and descendants, excluding `NEWSLETTERS > ALL OLD`. Cutoff is `2026-10-10T03:00:00Z`. Prior creations may be cited as source references, never republished as fresh final creative.

## Verified production changes — KOLLECTIVE BOH (`wfkohcwxxsrhcxhepfql`)
1. Set the two `GOOD TIMES NIGHTLIFE28.png` Drive IDs `1YOx1EuqS2-WcgliJU8u0ahYjD7j36HRK` and `1t7tRMDYCJnY7-Es8INSouH2rTYwJZcrU` to `metadata.source_epoch_ok=false`. Google creation dates September 22 and September 29; both precede cutoff. Preserve past scheduling history.
2. Backed up 6,122 remaining previously eligible rows to `private.khg_marketing_asset_eligibility_backup_v5`, then set each source flag to false with `eligibility_hold=PENDING_LIVE_DRIVE_CREATION_VERIFICATION`. This is a reversible eligibility hold, not deletion. Current source-eligible count 0 pending fresh attestation.
3. Created private `khg_foundation_gate_backups` and `khg_foundation_view_backups` containing prior source/QA functions, marketing law snapshot and social scheduling view. Backups restricted to privileged roles.
4. Replaced `enforce_marketing_asset_tree`: a positive cached flag needs verified Google Drive createdTime, attesting connector and verified ancestry. Block unauthorized folder roots and missing evidence.
5. Replaced `enforce_marketing_source_epoch`: each NEW approved/scheduled/publishing/first-published campaign must include at least one post-cutoff FINAL file with attested metadata. `asset_refs[].usage_role=source_reference` may point to older internal references but does not qualify as a final output.
6. Replaced `enforce_canonical_creative_source`: exact package and independent reviewer, QA timestamp after cutoff, `quality_score >= 95`, `critical_defects=0`, `brand_fidelity_pass=true`, and provider proof before NEW published transition.
7. Added `enforce_founder_social_brand_laws` and updated `v_marketing_instagram_schedule`: retired character category prohibited for founder publishing; 09:30 Eastern Hakuna Matata carousel, 12:30 Eastern real BTS; exact caption footer required.
8. Added service-role-only `khg_marketing_release_preflight(uuid)`: validates assets, verified creation, brand attribution, exact independent QA, scheduling/launch authorization and reference-only distinction immediately before an external dispatch.
9. Deployed Supabase `social-publish-runtime-bridge-v1` version **9**. It invokes release preflight per job BEFORE forwarding to the Meta gateway. No job is forwarded when the preflight fails or errors. Older `source_reference` inputs are excluded from the media payload. Provider job proof and well-formed Instagram permalink are required before the bridge records publication.

## REQUIRED: Reindex new fresh creative (Claude)
The source registry is intentionally fail-closed. For each real fresh MARKETING file, Claude's `re-index marketing` run must verify Google Drive `files.get` createdTime, ancestry up to the exact canonical root, excluded archive path, file ID, brand owner and no unapproved source reuse. Set `metadata.drive_metadata_verified_by='google_drive_connector'`, `metadata.drive_created_time_verified_utc`, `metadata.drive_ancestry_verified_at`, and only then `source_epoch_ok=true` if createdTime is on/after cutoff. Old logos/products may be reference-only in a newly produced original, not final publishable media.

The QA package in `marketing_asset_source_laws.source_registry.verified_packages[content_operation_id]` must match exact caption, asset_refs, entity and content type; include author/reviewer (distinct), `qa_result='passed'`, `qa_at`, `quality_score>=95`, `critical_defects=0`, `brand_fidelity_pass=true`. The publishing bridge also requires `asset_refs[].source_brand` and explicit cross-promotion consent if brands differ.

## Verified tests
- Marketing Source Gate ZIP offline Python tests: 13/13 pass. This tests fixtures, not installed ChatGPT routing.
- PostgreSQL temporary-table negative tests: old asset, unindexed file, and reference-only package all blocked. Transaction rolled back; no test rows persisted.
- PostgreSQL temporary-table DORSEY tests: 4 rejected cases (retired category, incorrect 09:30, incorrect 12:30, missing footer) and 1 valid founder-layout case. Transaction rolled back; no test rows persisted.
- `khg_marketing_release_preflight` refuses a real historical non-scheduled operation with `NOT_APPROVED_SCHEDULED`.
- `v_marketing_instagram_schedule.ready_to_publish = true`: 0 rows.
- `marketing_drive_assets.metadata.source_epoch_ok = true`: 0 rows, by design pending correct reindex.
- Vercel projects `kollective-command`, `kollective-enterprise-app` and `kollective-customer`: no runtime errors reported in last 24 hours; NOT a 98/100 QA or screenshot certification.
- Installed KHG Skills visible in founder-provided ChatGPT screenshot, but custom Skill runtime routing not independently exposed/certified in this session.

## Still NOT certified (do not report PASS)
- Brand Fidelity Review requires actual before/after asset visual-fidelity tests, not just DB metadata assertions.
- Creative Image Factory requires real native image-generation runs with separately delivered images; contact sheets prohibited. It has not been invoked for this audit.
- Web/App Release Guardian requires exact-build desktop/mobile screenshots, functional user flows, zero critical regressions and 98/100 audited quality; no deployment made.
- Publishing Approval & Proof: database and bridge gating repaired; a real provider-side Meta publish/reconciliation acceptance test was deliberately not sent. The gateway's provider proof is a provider-job receipt, not a fresh independent Meta API re-query.
- Other direct integrations/platform providers may have separate dispatch paths; this audit focuses on the known BOH marketing publisher bridge.

## Preservation and rollback
Prior SQL function definitions / policy and scheduling view: private backup tables. Former asset metadata: private eligibility backup table. Prior bridge deployments are versioned in Supabase. Nothing was deleted from Drive or Supabase source records, no outbound send, payment or Vercel deployment was made.

## Principle
Prepared/approved/scheduled/publishing/published/collected are distinct. Always require receipts and real source verification. Never treat this GitHub PR as the final app visual QA result.


## 2026-10-10 continuation: bypass hardening
- BOH `social-publish-runtime-bridge-v1` **v9** now derives all outgoing media URLs exclusively from exact final `asset_refs`, excluding `usage_role=source_reference`. Caller-supplied staged URL overrides cannot replace approved media.
- BOH `ghl-bridge-verifier` **v6** verifies the signed social payload AND independently re-runs `khg_marketing_release_preflight` for each included content operation before the gateway accepts the signed request. It compares campaign caption, brand, Instagram account, content type, scheduled time, idempotency key and exact media URLs against the BOH source-of-truth.
- DORSEY scheduling view no longer has the retired five-slide carousel-specific approval condition. Founder character-content blocking remains explicit.
- Verified Google Drive examples showed that some files uploaded after 03:00 UTC were originally edited in September. Merely copying old creative to a new Drive file is insufficient. Final asset eligibility now requires verified Drive createdTime AND modifiedTime, evidence of original production after cutoff, and reviewer attestation. Source photos/logos/products may remain `source_reference`.
- Controlled rollback-only database tests rejected: pre-cutoff completed assets, unindexed files, source-reference-only packages, old re-uploads, and missing freshness evidence. A simulated genuinely new file with complete evidence passed. These are **local DB acceptance tests**, not live Meta acceptance.
- Current production release state: 0 assets marked `source_epoch_ok=true`; 0 Instagram content operations `ready_to_publish=true`. This is a fail-closed hold pending a proper `re-index marketing` of genuinely fresh production assets.
- Vercel production UI was left unchanged. App 98/100 screenshot and functional release certification are **not** complete, even when Vercel reports no runtime errors. Skills installation is confirmed by founder screenshots; custom Skills runtime invocation remains separate from server-side gates.

## Required resume path
1. Run authenticated full MARKETING re-index with actual Drive file ID, parent ancestry, createdTime, modifiedTime, source-brand attribution, and separately verified fresh-creative production evidence; never flip every source flag based on folder membership or upload time.
2. Independently QA newly produced graphics in their own final files (no contact sheets; native generation; real logos and products, faces unchanged); record exact QA packages.
3. Prove at least one approved **non-publishing** dry run through bridge/Gateway checks, then perform a separately authorized controlled production publish test if founder requests it. Do not auto-publish.
4. Test website/app current build on mobile and desktop with customer paths, zero critical regressions, and a measured >=98/100 score before certifying Web/App Release Guardian.
