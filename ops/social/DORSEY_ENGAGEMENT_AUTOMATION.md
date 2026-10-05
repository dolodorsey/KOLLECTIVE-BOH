# Dr. Dorsey Engagement Automation

This is the persistent operating layer for @DOLODORSEY. It is designed so the founder does not have to relaunch engagement work every day.

## Persistent schedule

- Hourly: Dorsey Engagement Engine
- Daily 08:55 ET: queue reset / cadence check
- Daily 23:15 ET: provider-proof closeout / learning / queue refill

## Queue control

- Maintain 500 open research/action records.
- Refill with public.replenish_dorsey_engagement_queue_v1(500).
- New records start as research + needs_context.
- No comment or DM is generated without current verified context.
- No duplicate writers.

## Safe cadence

Ramp 0:
- 6 comments/day
- 4 Story interactions/day
- 1 signal-based DM/day
- 10 total external actions/day
- 2 max / rolling 60 minutes
- 4 max / rolling 4 hours
- 20 minute minimum proactive gap
- 120 minute minimum DM gap
- 72 hour target cooldown
- max 2 proactive touches / target / 7 days
- proactive window 09:00-23:00 America/New_York
- DMs manual approval only

The cadence may advance only through public.advance_dorsey_engagement_cadence_v1() when provider-backed clean evidence meets the ramp gate. Any provider warning, rate-limit signal, or action block pauses proactive execution while internal research continues.

## System health

Read public.v_dorsey_engagement_system_health_v1 for the current open queue, execution proof, learning events, cadence phase, gate status, and risk state.

## Founder involvement

No daily launch is required. Escalate only material risk, platform/account issues, manual-approval DMs, or true founder-only decisions.
