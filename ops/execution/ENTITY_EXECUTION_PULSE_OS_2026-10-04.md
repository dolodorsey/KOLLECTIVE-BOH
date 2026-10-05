# Entity Execution Pulse OS — 2026-10-04

## Objective

Prevent end-of-day discovery of missed execution. The operating system must check execution continuously, isolate brands, report exactly one current-focus entity at a time, and attach a corrective plan to every update.

## Founder visibility contract

- Internal reconciliation: every 10 minutes where provider reconciliations already exist.
- Full enterprise pulse snapshot: hourly at minute 07.
- Entity execution checkpoint: every 30 minutes at minute 12 and 42.
- Founder chat update: hourly, exactly one entity per update.
- Executive portfolio rollups remain at 10 AM, 2 PM and 6 PM ET.
- Dead-execution threshold: 90 minutes without verified progress.
- Scheduled is not posted. Drafted is not sent. Configured is not running. Unknown means unknown.
- Founder is escalated only for binding terms, new spend/budget, equity/ownership, high-risk legal/compliance commitments, irreversible changes, or a true founder-only blocker.

## One-entity checkpoint format

Each update must contain:

1. Entity
2. Master objective / current focus
3. Movement since the prior checkpoint
4. Verified proof gained
5. Miss / blocker
6. Root cause
7. Corrective action
8. Next 60-minute target
9. Expected proof at next checkpoint
10. Founder-only decision, only when truly required

## Improvement loop

CHECK -> COMPARE -> DIAGNOSE -> CORRECT -> EXECUTE -> PROVE -> NEXT

If there is no new proof, the system must not wait until the next daily closeout. It immediately advances the next executable action. If an external route is blocked, the entity continues internal research, enrichment, QA, preparation, reconciliation, or asset work that moves the objective.

## Canonical production surfaces

Supabase project: KOLLECTIVE BOH `wfkohcwxxsrhcxhepfql`

Core objects:
- `enterprise_chatgpt_space_registry`
- `enterprise_chatgpt_space_sections`
- `v_dot_focus_space_command_v1`
- `v_focus_dead_execution_risk_v1`
- `v_focus_operating_truth_v1`
- `enterprise_pulse_snapshots`
- `entity_execution_checkpoints`
- `v_entity_execution_checkpoint_queue_v1`
- `v_entity_execution_checkpoint_current_v1`
- `capture_next_entity_execution_checkpoint_v1()`
- Edge Function `dot-focus-space-os` schema v4

## Space contract

All current focus Spaces carry:
- 30-minute checkpoint cadence
- 60-minute founder update cadence
- one-entity-at-a-time reporting
- no-end-of-day-surprises rule
- 90-minute proof-staleness threshold
- required checkpoint fields
- proof-first completion standard

## Current scope

The current Space OS focus registry contains 34 active current-focus Spaces, including the top-level focus entities and active child brands. Every one uses the same execution-control contract while remaining brand-isolated.

## Deployment truth

The KOLLECTIVE enterprise command app production deployment was verified READY on Vercel with no runtime errors in the prior 24-hour window at the time this operating standard was activated.

## Security

The entity checkpoint table is RLS-enabled and is intended for service-role/internal execution. The checkpoint capture function is not executable by anon or ordinary authenticated roles.
