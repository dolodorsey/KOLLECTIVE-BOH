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
