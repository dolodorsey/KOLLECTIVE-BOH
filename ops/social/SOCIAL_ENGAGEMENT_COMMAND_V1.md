# Social Engagement Command v1

## Purpose

Use the existing Instagram audience graph to rebuild real relationship signals for one entity at a time. The system is entity-isolated and proof-based.

First entity: **Dr. Dorsey / @DOLODORSEY**.

## Core loop

1. Select the next 100 qualified accounts from the entity's verified audience pool.
2. Work in 20-account research blocks.
3. Review the live account/post context before any action.
4. Prefer a specific public comment when there is something genuine to add.
5. Consider a DM only after a meaningful signal (public interaction, reply, story signal, clear existing relationship context, or another legitimate reason).
6. Apply the entity's DM approval policy.
7. Record execution, replies, conversions, and proof.
8. Use results to improve content and target selection.

## Dr. Dorsey configuration

- Audience source: `ig-export-20261004`
- Growth pool: 70,860
- Multi-signal warm pool: 2,944
- Superfan pool: 165
- Cycle size: 100
- Research block: 20 accounts
- Comment cap: 8/day
- DM cap: 4/day
- Total outbound touch cap: 12/day
- Cooldown: 72 hours
- Maximum unanswered DM follow-ups: 1
- DM mode: manual approval
- Inbound @DOLODORSEY DM replies remain founder-manual
- Mass comments, emoji-only engagement, copied comments, automated cold DMs, and cross-brand messaging are prohibited

## Dashboard

Kollective Command:
`/ops-os/engagement`

The dashboard shows:
- addressable warm audience
- multi-signal and superfan pool
- open action queue
- comment/DM caps and execution
- replies
- conversions
- five 20-account blocks for the 100-shot cycle
- target links
- copy drafting
- action state
- manual DM queueing after a signal

## Source of truth

- `social_engagement_programs`: per-entity rules and caps
- `social_engagement_actions`: exact comment/DM/research action ledger
- `growth_social_engagement_targets`: qualified account universe
- `v_social_engagement_entity_command_v1`: dashboard rollup
- `social_execution_receipts`: provider proof when execution is available
- `growth_signal_events`: relationship/intent signals
- `growth_attribution_touchpoints`: down-funnel attribution

## Entity rollout rule

Do not bulk-enable every entity at once.

For each entity:
1. verify the official account and route;
2. identify its owned/allowed audience source;
3. establish comment and DM policy;
4. set caps;
5. seed one 100-account cycle;
6. verify dashboard and proof;
7. only then move to the next entity.
