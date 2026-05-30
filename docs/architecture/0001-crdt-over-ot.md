# ADR 0001 — CRDT (Yjs) over Operational Transform

**Status:** Accepted
**Date:** 2025-01-15

## Context

We need a real-time collaborative editor: multiple users editing the same document, sub-second sync, conflict-free convergence, and ideally offline support.

Two established approaches:

- **Operational Transform (OT)** — what Google Docs uses. Operations are transformed against concurrent ops before being applied. Convergence is guaranteed only when a single central authority sequences operations.
- **CRDT (Conflict-free Replicated Data Types)** — operations carry enough metadata that they can be applied in any order and still converge. No central authority required.

## Decision

Use **Yjs CRDTs** for documents. Use last-writer-wins with server-assigned timestamps for chat.

## Consequences

### Wins

- **Offline-first**: clients edit while disconnected, sync deltas on reconnect. CRDTs handle this natively; OT requires extra plumbing.
- **Library maturity**: Yjs has battle-tested adapters for TipTap/ProseMirror. Avoids ~12 engineer-months of custom OT engine work.
- **P2P-capable**: we don't need it today, but the option exists if we ever want edge-to-edge sync.

### Costs

- **Higher memory footprint**: each character carries metadata. Mitigated by periodic snapshot + GC (re-encode the doc, drop tombstones).
- **More complex internal representation**: less obvious how to query "diff between version A and B"; we lean on `documentVersion` append-only history for that.

### What we explicitly traded away

- Lower per-char overhead of OT.
- The simpler mental model of a single authoritative server.

## Implementation notes

- Y.Doc per document, broadcast updates via Socket.IO room `doc:{id}`.
- Persistence is two-tier: every update appended to `document_versions`, full state snapshot to `documents.yDoc` every 100 updates / 30s.
- Awareness (cursor, selection, user color) is broadcast-only, never persisted.

## Revisit when

- Memory cost outgrows snapshot-and-GC: consider OT or a custom CRDT with smaller op metadata.
- We need provable cross-client diff semantics beyond what version history provides.
