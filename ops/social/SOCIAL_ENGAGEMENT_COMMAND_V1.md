# Social Engagement Command v1

## Purpose

Use the existing Instagram audience graph to rebuild real relationship signals for one entity at a time. The system is entity-isolated and proof-based.

First entity: **Dr. Dorsey / @DOLODORSEY**.

## Core loop

1. Select the next 100 qualified accounts from the entity's verified audience pool.
2. Process the audience continuously in large background batches; use 20-row dashboard views only for readability.
3. Review the live account/post context before any action.
4. Prefer a specific public comment when there is something genuine to add.
5. Consider a DM only after a meaningful signal (public interaction, reply, story signal, clear existing relationship context, or another legitimate reason). Do not attempt to DM every account.
6. Apply the entity's DM approval policy.
7. Record execution, replies, conversions, and proof.
8. Use results to improve content and target selection.

## Dr. Dorsey configuration

- Audience source: `ig-export-20261004`
- Growth pool: 70,860
- Multi-signal warm pool: 2,944
- Superfan pool: 165
- Background audience scan target: 10,000/day
- Live/context review target: 1,000/day
- Direct-touch candidate target: 100/day
- Current activation cycle target: 1,000 accounts
- Dashboard views: 20 rows each for readability only; they are not daily limits
- Contextual comment working cap: 25/day
- Manual-approval DM working cap: 10/day
- Total external touch working cap: 35/day
- Cooldown: 48 hours
- Provider warnings/action blocks trigger immediate backoff
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


## Background workforce

This lane is a standing background responsibility.

- Muse: live-context review, comment/DM drafting, reply monitoring
- Dot: scoring, dedupe, cooldown, proof, handoff
- ChatGPT: strategy, QA, pattern synthesis, next-wave decisions
- Claude: second-pass pattern/quality review when runtime is available

The recurring internal operation is `background-v1:dr-dorsey:audience-engagement-engine` and runs hourly. Internal scoring/research continues even when external social execution is blocked.


## Dr. Dorsey voice + anti-repetition upgrade (2026-10-05)

Current production controls:
- 65 active Dorsey context/voice patterns in `social_engagement_voice_patterns`
- 23 action choices in `social_engagement_action_menu`
- exact-copy fingerprinting
- token-overlap similarity QA
- repeated sentence-structure QA
- similarity >= 0.72 => blocked and returned to `needs_context`
- similarity >= 0.50 => review
- repeated recent structure => review
- copy QA dashboard view: `v_social_engagement_similarity_guard_v2`

A draft cannot be generated from the voice bank alone. It must be attached to:
- a current post detail;
- a current Story detail;
- a current account/business signal; or
- verified prior relationship context.

No-action, watch, like-only, save-only and revisit-later are valid decisions. The system is not required to comment on every high-scoring target.

### Learning loop

Production event ledger: `social_engagement_learning_events`

Proof-weight events:
- executed: +0.10
- reply: +1.50
- DM reply: +2.00
- follow: +4.00
- conversion: +3.00

Aggregate learned weights:
`v_social_engagement_learning_weights_v1`

The learned weight applies to:
`context_key + voice_mode + action_type`

It is an optimization signal only. Live-context fit, brand isolation, DNC/opt-out, platform safety, copy quality and verified execution proof remain higher-priority gates.

### Dorsey processing cadence

- initial lightweight score/segment pass: up to 5,000 warm accounts/day
- steady-state refresh after full pass: about 1,000/day
- live-context review: about 300/day
- direct-touch candidates ranked: about 60/day
- comment drafts: up to 30/day
- DM drafts: up to 8/day, meaningful-signal + manual-approval only
- external touch caps remain separate from internal processing
