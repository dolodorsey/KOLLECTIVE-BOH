// Source-control contract tests for KHG foundation gates.
// Static checks against version-controlled deployed snapshots.
// These tests do NOT replace live Drive, Postgres, Meta, or visual QA.
import test from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";

const root = new URL(".", import.meta.url);
const read = (file) => readFileSync(new URL(file, root), "utf8");
const sql = read("2026-10-10-production-snapshot.sql");
const bridge = read("social-publish-runtime-bridge-v1.index.ts");
const verifier = read("ghl-bridge-verifier.index.ts");
const gateway = read("boh-social-publish-runtime-v1.gateway.index.ts");
const doc = read("README.md");

test("canonical MARKETING root and 2026-10-10 cutoff are explicit", () => {
  assert.match(sql, /1OjxHeuwZnD6_vI4WOGz8i4BJ61BsR9Ya/);
  assert.match(sql, /2026-10-10T03:00:00Z/);
  assert.match(doc, /NEWSLETTERS > ALL OLD/);
});
test("source-reference assets never qualify as fresh finals", () => {
  assert.match(sql, /source_reference/);
  assert.match(sql, /SOURCE_GATE_FRESH_FINAL_CREATIVE_REQUIRED/);
  assert.match(sql, /NO_FRESH_FINAL_CREATIVE/);
  assert.match(sql, /source_reference/);
  assert.match(bridge, /trustedMediaManifests/);
});
test("final assets require independently verified Drive ancestry and timestamps", () => {
  for (const token of [
    "drive_metadata_verified_by", "drive_ancestry_verified_at",
    "drive_created_time_verified_utc", "drive_modified_time_verified_utc",
    "original_creative_produced_at_utc", "fresh_creative_reviewed_by",
  ]) assert.ok(sql.includes(token), token);
  assert.match(sql, /file_modified<epoch/);
  assert.match(sql, /original_created<epoch/);
});
test("pre-cutoff re-uploads are denied", () => {
  assert.match(sql, /original_created>file_modified/);
  assert.match(sql, /SOURCE_GATE_PRE_CUTOFF_FINAL_ASSET/);
});
test("wrong or unindexed assets cannot pass the pre-dispatch source gate", () => {
  assert.match(sql, /SOURCE_GATE_MISSING_OR_PROHIBITED_DRIVE_ASSET/);
  assert.match(sql, /ASSET_NOT_CANONICAL/);
  assert.match(sql, /UNVERIFIED_FINAL/);
});
test("graphical creative must meet 95-point quality and zero critical defects", () => {
  assert.match(sql, /score<95/);
  assert.match(sql, /quality<95/);
  assert.match(sql, /critical_defects/);
  assert.match(sql, /brand_fidelity_pass/);
});
test("independent QA, exact package, and fresh review are required", () => {
  assert.match(sql, /verified_packages/);
  assert.match(sql, /packet->>'reviewer'=packet->>'author'/);
  assert.match(sql, /EXACT_INDEPENDENT_QA_INCOMPLETE/);
  assert.match(sql, /STALE_QA/);
});
test("source-brand attribution and cross-brand approval are checked", () => {
  assert.match(sql, /SOURCE_BRAND_ATTRIBUTION_MISMATCH/);
  assert.match(sql, /CROSS_BRAND_ASSET_NOT_APPROVED/);
});
test("DORSEY schedule and caption footer remain enforced", () => {
  assert.match(sql, /DORSEY_0930_HAKUNA_EDITORIAL_CAROUSEL_ONLY/);
  assert.match(sql, /DORSEY_1230_REAL_BTS_ONLY/);
  for (const token of ["#DrDorsey", "@KOLLECTIVEHOSPITALITY", "@THEICONICLIVE",
    "@GOODTIMESWORLDWIDE", "@THESOLEEXCHANGEWORLDWIDE"])
    assert.ok(sql.includes(token), token);
});
test("retired DORSEY category is hard-stopped and obsolete carousel count gate absent", () => {
  assert.match(sql, /DORSEY_RETIRED_CHARACTER_CATEGORY_PROHIBITED/);
  assert.doesNotMatch(sql, /parable_asset_verified/);
});
test("unverified publication receipt cannot set a newly published status", () => {
  assert.match(sql, /PUBLISH_PROVIDER_VERIFIED_RECEIPT_REQUIRED/);
  assert.match(sql, /provider_proof_received/);
  assert.match(bridge, /provider_proof_received:\s*rec\.proof===true/);
});
test("BOH bridge checks each job before dispatch and omits source references", () => {
  assert.match(bridge, /db\.rpc\("khg_marketing_release_preflight"/);
  assert.match(bridge, /blockedPreflight\.push/);
  assert.match(bridge, /const jobs=allowedRows\.map/);
  assert.match(bridge, /media_manifest:trustedMediaManifests/);
  assert.match(bridge, /media_urls:\(trustedMediaManifests\.get/);
  assert.doesNotMatch(bridge, /media_urls:\(Array\.isArray\(r\.metadata\?\.provider_media_urls\)/);
});
test("HMAC gateway rejects unsigned and mismatching live campaigns", () => {
  assert.match(verifier, /signature_invalid/);
  assert.match(verifier, /khg_marketing_release_preflight/);
  assert.match(verifier, /signed_media_or_campaign_mismatch/);
  assert.match(verifier, /invalid_social_idempotency_key/);
  assert.match(verifier, /JSON\.stringify\(job\?\.media_manifest/);
  assert.match(verifier, /JSON\.stringify\(data\.media_manifest/);
});
test("no literal production credentials added to files", () => {
  const combined = [sql, bridge, verifier, gateway, doc].join("\n");
  assert.doesNotMatch(combined, /sk-(?:proj|live)-[A-Za-z0-9_-]{20,}/);
  assert.doesNotMatch(combined, /ghp_[a-zA-Z0-9]{32,}/);
  assert.doesNotMatch(combined, /github_pat_[a-zA-Z0-9_]{32,}/);
});

test("preflight rejects missing canonical brand even when sender provides a brand label", () => {
  assert.match(sql, /CANONICAL_SOURCE_BRAND_MISSING/);
  assert.match(sql, /sourcebrand IS NULL/);
});
test("all final media is bound to independent original SHA-256 proof", () => {
  assert.match(sql, /FINAL_MEDIA_DIGEST_NOT_ATTESTED/);
  assert.match(sql, /final_sha256_by_drive_id/);
  assert.match(sql, /verified_content_sha256/);
  assert.match(sql, /'media_manifest',manifest/);
});
test("BOH bridge sends only the canonical final-file manifest from preflight", () => {
  assert.match(bridge, /trustedMediaManifests\.set/);
  assert.match(bridge, /TRUSTED_MEDIA_MANIFEST_REQUIRED/);
  assert.match(bridge, /media_manifest:trustedMediaManifests/);
  assert.doesNotMatch(bridge, /function mediaUrls\(/);
});
test("HMAC verifier compares exact canonical manifest and media URLs", () => {
  assert.match(verifier, /signed_media_or_campaign_mismatch/);
  assert.match(verifier, /job\?\.media_manifest/);
  assert.match(verifier, /data\.media_manifest\.map/);
});
test("provider gateway hashes bytes before immutable media staging", () => {
  assert.match(gateway, /sha256Body\(body\)/);
  assert.match(gateway, /source_media_digest_mismatch/);
  assert.match(gateway, /trusted_media_manifest_required/);
  assert.match(gateway, /upsert:false/);
  assert.match(gateway, /staged_existing_media_digest_mismatch/);
  assert.match(gateway, /media_staging:stagedMedia/);
});
