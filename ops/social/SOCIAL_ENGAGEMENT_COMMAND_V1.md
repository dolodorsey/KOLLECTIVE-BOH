# Social Engagement Command v1

## Purpose

Use the existing Instagram audience graph to rebuild real relationship signals for one entity at a time. The system is entity-isolated and proof-based.

First entity: **Dr. Dorsey / @DOLODORSEY**.

## Core loop

1. Rank the verified Dorsey warm-audience universe continuously.
2. Run lightweight scoring at data speed and reserve deeper review for the highest-value accounts.
3. Review live post, Story, account, or verified prior-relationship context before choosing an action.
4. Choose the lightest genuine action: no-action, watch, like, save, comment, Story response, or DM after signal.
5. Never force a comment. Never turn the warm pool into a mass-DM list.
6. Apply Dorsey-specific copy-variation QA before a draft advances.
7. Record execution, replies, follows, conversions, and provider proof.
8. Feed proven context + voice + action combinations back into target and content strategy.

## Current Dr. Dorsey production configuration

- Audience source: `ig-export-20261004`
- Warm growth pool: **70,860**
- Multi-signal warm pool: **2,944**
- Superfan pool: **165**
- Active exact-account priority queue: **500**
- Initial lightweight score/segment pass: **up to 5,000/day**
- Estimated initial full-pool pass: **~15 days**
- Steady-state rolling refresh after full pass: **~1,000/day**
- Deeper live-context review target: **~300/day**
- Direct-touch candidates ranked: **~60/day**
- Contextual comment drafts: **up to 30/day**
- Approval-gated DM drafts: **up to 8/day**
- Actual comment cap: **20/day**
- Actual DM cap: **6/day**
- Total targeted external touch cap: **26/day**
- Cooldown: **72 hours**
- Maximum unanswered DM follow-ups: **1**
- DM mode: **manual approval**
- Inbound @DOLODORSEY DM replies remain founder-manual
- Provider warnings/action blocks trigger immediate backoff
- Mass comments, copied comments, automated cold DMs, and cross-brand messaging are prohibited

Internal processing volume and external action volume are intentionally separate. The system can score thousands of accounts without touching thousands of accounts.

## Dashboard

Kollective Command:
`/ops-os/engagement`

The dashboard now surfaces:
- addressable warm audience
- multi-signal and superfan pools
- active research queue
- background scan / context review / touch-candidate targets
- comment and DM caps
- Dorsey voice-pattern count
- action-option count
- copy-similarity QA flags
- reply / conversion learning signals
- target links and context queue
- action selection
- context + voice selection
- copy drafting and QA
- manual DM queueing after a meaningful signal
- follow / qualified-relationship outcome recording
- learning leaderboard once provider-backed outcomes exist

Dashboard row groupings are pagination/readability only. They are not daily processing limits.

## Source of truth

- `social_engagement_programs`: entity rules, caps, processing targets
- `social_engagement_actions`: research/comment/DM/Story action ledger
- `growth_social_engagement_targets`: qualified account universe
- `social_engagement_voice_patterns`: Dorsey context + voice frameworks
- `social_engagement_action_menu`: valid action-choice policy
- `social_engagement_learning_events`: reply/follow/conversion learning evidence
- `v_social_engagement_entity_command_v1`: dashboard rollup
- `v_social_engagement_queue_v1`: ranked current work queue
- `v_social_engagement_pattern_rank_v1`: response-weighted voice/pattern ranking
- `v_social_engagement_similarity_guard_v2`: anti-repeat QA exceptions
- `v_social_engagement_learning_weights_v1`: learned context + voice + action weights
- `social_execution_receipts`: provider proof
- `growth_signal_events`: relationship / intent signals
- `growth_attribution_touchpoints`: downstream attribution

## Dr. Dorsey voice + anti-repetition system

Current production controls:

- **65 active Dorsey context/voice patterns**
- **23 valid action choices**
- exact-copy fingerprinting
- token-overlap similarity QA
- repeated sentence-structure QA
- similarity **>= 0.72** => blocked/redraft
- similarity **>= 0.50** => review
- repeated recent structure => review
- "do nothing" is a valid successful decision
- live context is mandatory before copy generation

A draft cannot be generated from the voice bank alone. It must be attached to:
- a current post detail;
- a current Story detail;
- a current account/business signal; or
- verified prior relationship context.

### Anti-AI writing rules

Avoid:
- generic validation
- polished marketing phrasing
- repetitive compliment structures
- repeated emoji patterns
- forced slang
- fake familiarity
- identical sentence lengths
- automatic questions
- em-dash-heavy prose
- fabricated shared memories
- fake offers or fake collaboration interest

The system rotates:
- context
- voice mode
- sentence shape
- word count
- opener style
- closer style
- punctuation
- question/no-question
- action/no-action

## Learning loop

Production event ledger:
`social_engagement_learning_events`

Current proof weights:
- executed: **+0.10**
- reply: **+1.50**
- DM reply: **+2.00**
- follow: **+4.00**
- conversion: **+3.00**

Aggregate learned-weight view:
`v_social_engagement_learning_weights_v1`

The learned unit is:
`context_key + voice_mode + action_type`

Learning weights may influence future ranking only after live-context relevance, DNC/opt-out, brand isolation, platform safety, copy QA, and verified proof gates.

No response evidence means no invented learning. All new patterns begin neutral.

## Background workforce

This lane is a standing background responsibility.

- **Muse:** live-context review, comment/DM drafting, reply monitoring
- **Dot:** scoring, dedupe, cooldowns, queue control, proof reconciliation
- **ChatGPT:** strategy, QA, pattern synthesis, content-response learning
- **Claude:** second-pass pattern/quality review when runtime is available

ChatGPT recurring background task:
**Dorsey Engagement Engine** — hourly conditional watch.

BOH scheduled operation:
`background-v1:dr-dorsey:audience-engagement-engine`

If an external/provider execution route is unavailable, internal scoring, prioritization, QA, drafting, and learning-system maintenance continue. Never report external execution without provider evidence.

## Entity rollout rule

Do not bulk-enable every entity at once.

For each next entity:
1. verify the official account and execution route;
2. identify its owned/allowed audience source;
3. establish its own comment, Story, DM and approval rules;
4. build its own voice library;
5. set conservative caps and backoff rules;
6. seed a ranked research-first queue;
7. verify dashboard + proof;
8. learn from real outcomes;
9. only then scale or move to the next entity.
