# Architecture Decision Records

Every significant decision is recorded here as a short ADR. Format:

- `NNNN-kebab-title.md` — sequential number, never reused.
- Status: `Proposed` → `Accepted` → `Superseded by NNNN`.
- Sections: **Context**, **Decision**, **Consequences** (wins / costs / traded away), **Revisit when**.

## Why we do this

Six months from now no one remembers why we chose CRDTs over OT, or why the messages table doesn't have an `email` column. ADRs answer "why is it like this" without spelunking through git history.

## Index

- [0001 — CRDT (Yjs) over Operational Transform](0001-crdt-over-ot.md)
- [0002 — Shared-schema multi-tenancy with Row-Level Security](0002-multi-tenant-strategy.md)
- [0003 — Outbox pattern for cross-service events](0003-outbox-pattern.md)
- [0004 — AI Gateway as a dedicated service](0004-ai-gateway.md)
