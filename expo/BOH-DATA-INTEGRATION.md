# BOH Data Integration — gateway `boh` schema

**Audit finding (2026-07-28):** this app was pointed at Supabase project
`wfkohcwxxsrhcxhepfql` (`supabase_kollective_boh`), where **every operational
table is empty** — 0 organizations, 0 profiles, 0 entities, 0 entity_members,
0 tasks, 0 brand_configurations, 0 webhook_registry, 0 workflow_executions.
A fully-built app over an empty database.

The live enterprise data is in the gateway, `dzlmtvodpyhetvektfuo` — the same
backend as thedoctordorsey.com.

## The fix: a `boh` compatibility schema in the gateway

Rather than migrate an empty database or rename app queries, the gateway now
exposes a `boh` schema whose views match what the app expects:

| View | Source | Rows |
|------|--------|------|
| `boh.entities` | `kollective_public_entities` + `kollective_public_divisions` | **129** |
| `boh.divisions` | `kollective_public_divisions` | 8 |
| `boh.tasks` | `kollective_task_queue` | 9 |
| `boh.brand_resources` | `kollective_brand_resources` | 127 |
| `boh.workflow_executions` | `khg_agent_execution_queue` | 59,202 |
| `boh.agents` | `khg_managed_agents` | 2,885 |

`GRANT USAGE`/`SELECT` to `authenticated` and `service_role`. Read-only by
design — writes keep going through the app's own tables and tRPC routes until
each write path is mapped deliberately.

## Wiring it up

```ts
// lib/supabase.ts
createClient(url, key, { db: { schema: 'boh' } })
```

Or per-query: `supabase.schema('boh').from('entities')`

Env stays pointed at the gateway (see `env.example`).

## Why `boh` and not `public`

The gateway already has `organizations` (1 row), `profiles` (4) and `tasks` (0)
in `public` with different shapes. A separate schema avoids the collision and
keeps the BOH surface obvious to anyone reading the database.

## Removed in this branch

`rls-policies.sql` — it defined 14 policies on `alerts`, `users` and `workflows`,
**none of which exist in `supabase-schema.sql`**. It was a leftover from an
earlier schema generation. The real RLS lives inline in `supabase-schema.sql`,
which is complete: all 9 tables have RLS enabled and every one has policies,
on a 4-role model (`owner`/`admin`/`manager`/`staff`). Verified — no gaps.

---

## Auth binding (added 2026-07-28)

`boh.org_members` gained `auth_user_id`, `login_emails[]`, and `first_login_at`.
22 of 23 members carry at least one login email, harvested from `team_members`.

`boh.current_member()` resolves the caller in this order:
1. `auth.uid()` matched against `auth_user_id`
2. On first login, `auth.users.email` matched against `login_emails[]` — the
   binding is written back automatically, so each person self-links once
3. `p_actor` name, **service-role/server-side only**

All three write functions now resolve identity through it. An authenticated
user who is not on the roster gets `not on the BOH roster` — a real
authorization boundary, not name-string attribution.

### Roster permissions

| Role | Who | Can |
|------|-----|-----|
| `owner` | Dr. Dorsey | everything, including lifecycle changes |
| `admin` | JL, Nya, Sharky | lifecycle changes, focus, tasks |
| `manager` | Brittany | focus, tasks |
| `staff` | 18 others | tasks **only for their assigned brands** |

### RLS
Enabled on all three `boh` tables, 4 policies. Roster, entity settings, and
organizations are readable only by people who resolve to a roster record;
members may update their own row and no one else's.

## Client wiring

- `lib/supabase.ts` exports `getBoh()` (a second client on `db: { schema: 'boh' }`,
  same session) and `getCurrentMember()`
- `entities` route reads `boh.entities` (129 rows) instead of the empty
  `entities` table, and drops the broken `owner:users(...)` join
- New `entities.settings` returns an entity's operating profile
- New `tasks` router reads `boh.tasks` and writes via `boh.create_task`;
  policy rejections surface as errors instead of silent no-ops
- New `roster` router: `me`, `list`, `divisions`

---

## Screens (2026-07-28)

The data layer was live but the screens still rendered the old shapes.

**`app/(owner)/_layout.tsx` — role-aware tabs.** Every signed-in user previously
saw all seven owner tabs. Now driven by `roster.me.boh_role`: owner/admin get
all seven, manager loses People, staff see only Command Center, Entities and
Profile. Eighteen of twenty-three members are staff.

**`app/(owner)/entities.tsx`** — filter chips were `all / active / inactive /
archived`; only `active` exists. Two of the four filtered to nothing and
`portfolio` (83 entities, the largest group) was unreachable. Chips now use the
real lifecycle set. Cards show `category` (the old code read `entity.type`,
which does not exist), division, current focus and city scope.

**`src/utils/health.ts`** — `computeHealth` read `alerts_open`,
`failed_runs_24h` and `last_activity_at`, none of which exist on the entity
record, so **every entity resolved to "healthy"**. Rewritten to derive from
lifecycle, with a `needs_focus` signal for live entities that have no stated
current focus — the one case actually worth surfacing.

**`app/(owner)/people.tsx`** — was a placeholder reading "Assembling the
squad...". Now renders the real 23-person roster grouped by permission tier.

**`app/(team)/tasks.tsx`** — was a placeholder reading "Ready to execute the
vision...". Now loads the signed-in member's assigned tasks from the live
queue, with priority colours, blocker reasons, pull-to-refresh, and an explicit
"not on the BOH roster" state for authenticated users with no roster record.

## Duplicate source removed

`BOH-PART1/` (70 files) and `BOH-PART2/` (45 files) were a second, older copy of
the whole app sitting inside `expo/` — the same class of artifact as the
`* 2/` folders removed earlier, just without the space in the name. Nothing
imports them, and root `app/` is the superset (it has `operations.tsx`, they do
not). Both removed: 115 files.

That means this repo carried **three copies** of the app. Two are now gone.

---

## Build verification (2026-07-28)

Dependencies installed (1,037 packages) and the branch compiled for real rather
than reasoned about.

**`npx tsc --noEmit`: 9 errors → 0.**

| Error | Origin | Fix |
|-------|--------|-----|
| `entities.tsx` — indexing `Record<EntitySignal,string>` with `any` | this branch | typed the mapped result |
| `lib/supabase.ts` — `SupabaseClient<…,'boh',…>` not assignable to the public-schema type | this branch | widened the generic on `bohInstance` / `getBoh()` |
| `BrandTile.tsx` — `width: "undefined%"` when `taskCompletion` is undefined | **pre-existing** | clamped to `0–100` |
| `HeroCommandStrip.tsx` — web-only `outlineStyle:'none'` not in `TextStyle` | **pre-existing** | cast via `StyleProp<TextStyle>` |
| `push-notifications.ts` ×5 — imports `expo-device`, `expo-notifications` (neither installed) and `./supabase` (wrong path) | **pre-existing** | removed |

`push-notifications.ts` was orphaned — nothing imported it, and its relative
import pointed at a file that does not exist at that path. It has been removed
rather than patched. Push support should be reintroduced deliberately when
`kollective_app_push_tokens` is actually wired; git preserves the original.

**`npx expo export -p web`: succeeded.** 2,631 modules, 3.78 MB bundle, output
in `dist/` — matching `outputDirectory` in `vercel.json`. `dist/` is gitignored.

`installCommand` changed from `bun install` to `npm install --legacy-peer-deps`,
which is the path actually verified here. The dependency tree needs the legacy
peer resolver; a plain install fails.
