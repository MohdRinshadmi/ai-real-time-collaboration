# ADR 0002 — Shared-schema multi-tenancy with Row-Level Security

**Status:** Accepted
**Date:** 2025-01-20

## Context

We are SaaS. Tenants (workspaces) range from 1 user to thousands. We need:

- Strong isolation guarantees (no cross-tenant data leaks, ever)
- Cost-efficient at thousands of tenants
- Reasonable operational complexity

Options:

1. **Database per tenant**: hardest isolation, but operationally untenable past ~hundreds of tenants (connection pools, migrations, backups, monitoring all multiply).
2. **Schema per tenant**: medium isolation, mid-tier complexity. Still painful at scale.
3. **Shared schema with `workspace_id` on every row**: cheapest, but a single buggy query can leak data.

## Decision

**Shared schema** with `workspaceId` on every tenant-owned row, **plus Postgres Row-Level Security** as defense in depth.

The application sets `SET LOCAL app.current_workspace = '<id>'` at the start of every transaction. RLS policies filter rows by that GUC. Even if app code forgets `WHERE workspaceId = ...`, Postgres refuses to return cross-tenant rows.

## Consequences

### Wins

- One DB, one schema, one backup, one monitoring story.
- Scales to tens of thousands of tenants on a single primary (Citus when we outgrow it).
- RLS gives us a backstop against the most likely failure mode (app-layer bugs).

### Costs

- All app code must wrap tenant-scoped work in `withWorkspace(prisma, id, fn)`. Forgetting this returns zero rows — loud failure mode, easy to catch in tests.
- Cross-tenant queries (admin only) require a privileged role that bypasses RLS. Used carefully; gated behind `ROLE admin`.

### What we explicitly traded away

- Database-level guarantee that one noisy tenant can't affect others (would require separate DBs). We mitigate with PgBouncer + per-tenant query quotas in app.

## Implementation notes

See `packages/db/prisma/migrations/00000000000000_rls/migration.sql` for policy definitions.

## Revisit when

- One tenant grows large enough that its queries impact others (vertical scale exhausted).
- A regulatory requirement mandates physical isolation (HIPAA, FedRAMP High).
