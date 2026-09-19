# Website Screenshot Proof Law

Version: 3.0  
Effective: 2026-09-19  
Status: Blocking release standard

## Rule
A visual website change is not verified because the code compiled, Vercel says READY, a route returns HTTP 200, or an executor says it is fixed.

Screenshots are part of the build process itself.

## Required evidence loop
1. Capture the rendered baseline before meaningful visual work begins on an existing route.
2. Make the change.
3. Capture the affected route again before calling the issue fixed.
4. Compare against the baseline or previous failed candidate.
5. Log blockers.
6. Repair.
7. Recapture.
8. Repeat until zero blocking visual issues remain.

## Minimum iteration proof
- Desktop screenshot for every meaningful visual change.
- Mobile screenshot for every meaningful visual change.
- Tablet screenshot when layout behavior changes materially and always at release-candidate certification.
- State screenshots for commerce, forms, menus, modals, cart, variants, booking, PWA prompts, QR overlays, sticky UI and other interaction states.

## Exact-SHA rule
Candidate screenshots must belong to the exact preview SHA under review.
Production screenshots must belong to the exact live SHA being certified.
Stale screenshots cannot satisfy a gate.

## Before / after rule
Every repair needs an after screenshot. A repair with no after screenshot remains IN PROGRESS.

## Overlay rule
QR codes, PWA/install prompts, cookie panels, chat widgets, sticky CTAs and similar overlays are part of the actual rendered experience. If they obstruct content, compete with primary actions or dominate the viewport, visual certification fails.

## Release gate
Preview certification requires reviewed desktop, tablet and mobile evidence for the exact candidate SHA.
Production certification requires reviewed desktop, tablet and mobile evidence for the exact live SHA.

Deployment READY alone is never certification.

## No completion claim without proof
Do not report FIXED, COMPLETE, TOP-TIER, PRODUCTION-READY or CERTIFIED unless matching visual evidence exists and has been reviewed.

## Source of truth
Canonical standard: Supabase KOLLECTIVE BOH
- website_governance_standards / flagship_web_standard v3
- website_release_sop_steps / v3
- website_visual_evidence_log
- website_release_certifications

Database certification is blocked when required exact-SHA screenshot evidence is missing.
