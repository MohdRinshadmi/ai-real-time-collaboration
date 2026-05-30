# ADR 0003 — Outbox pattern for cross-service events

**Status:** Accepted
**Date:** 2025-02-01

## Context

When service A writes to its DB and needs to notify service B, the naive approach is "write, then publish to Kafka". This is the **dual-write problem**: if the DB write succeeds and the publish fails (network blip, broker down), we have inconsistent state with no recovery.

## Decision

Use the **transactional outbox** pattern:

1. Inside the same DB transaction, write the business row AND a row to `outbox(eventType, payload, ...)`.
2. A separate process (we use **Debezium** reading the Postgres WAL) reads outbox rows and publishes them to Kafka.
3. Consumers dedupe by event id in Redis (24h TTL) — at-least-once delivery becomes effectively-once.

## Consequences

### Wins

- No lost events. The DB transaction is the single source of truth.
- No `try { write; publish } catch { ??? }` ambiguity in app code.
- Replay-able: outbox rows survive Kafka outages.

### Costs

- Outbox table grows; trim with a partitioned `outbox_archive` weekly job.
- Consumer code must be idempotent.

### What we traded away

- Tightest possible latency. There's a small delay between the DB commit and the Kafka publish (typically <100ms via Debezium). For event-driven flows this is fine; for user-visible reads we use Redis pub/sub or direct API calls.

## Implementation notes

- `Outbox` model in `packages/db/prisma/schema.prisma`.
- Services write outbox rows; never publish directly to Kafka from app code.

## Revisit when

- We hit dual-write between non-DB systems (e.g., S3 write + DB write) and need similar guarantees. Different problem, different pattern (S3 lifecycle + reconciliation).
