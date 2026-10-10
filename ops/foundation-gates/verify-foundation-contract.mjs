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
  assert.match(bridge, /r\.usage_role!=="source_reference"/);
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
  assert.match(bridge, /media_urls:mediaUrls\(r\.asset_refs\)/);
  assert.doesNotMatch(bridge, /media_urls:\(Array\.isArray\(r\.metadata\?\.provider_media_urls\)/);
});
test("HMAC gateway rejects unsigned and mismatching live campaigns", () => {
  assert.match(verifier, /signature_invalid/);
  assert.match(verifier, /khg_marketing_release_preflight/);
  assert.match(verifier, /signed_media_or_campaign_mismatch/);
  assert.match(verifier, /invalid_social_idempotency_key/);
  assert.match(verifier, /JSON\.stringify\(approvedMediaUrls\(row\.asset_refs\)\)/);
});
test("no literal production credentials added to files", () => {
  const combined = [sql, bridge, verifier, doc].join("\n");
  assert.doesNotMatch(combined, /sk-(?:proj|live)-[A-Za-z0-9_-]{20,}/);
  assert.doesNotMatch(combined, /ghp_[a-zA-Z0-9]{32,}/);
  assert.doesNotMatch(combined, /github_pat_[a-zA-Z0-9_]{32,}/);
});
