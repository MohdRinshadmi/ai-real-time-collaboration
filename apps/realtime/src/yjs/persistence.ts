import * as Y from 'yjs';

import { createPrismaClient } from '@collab/db';

// Two-tier persistence:
//
//   1. Append every update to document_versions (cheap, append-only).
//      Lets us replay history / time-travel.
//   2. Every N updates OR T seconds, snapshot Y.encodeStateAsUpdate to
//      documents.yDoc — this is what new clients sync against.
//
// Snapshotting is the expensive write; we batch it to keep p95 latency
// of edits flat.

const prisma = createPrismaClient();

const SNAPSHOT_THRESHOLD = 100;
const SNAPSHOT_INTERVAL_MS = 30_000;

const counters = new Map<string, number>();
const timers = new Map<string, NodeJS.Timeout>();

export async function loadDocument(documentId: string): Promise<Uint8Array | null> {
  const row = await prisma.document.findUnique({
    where: { id: documentId },
    select: { yDoc: true },
  });
  if (!row || row.yDoc.length === 0) return null;
  return new Uint8Array(row.yDoc);
}

export async function persistUpdate(documentId: string, update: Uint8Array, authorId: string) {
  await prisma.documentVersion.create({
    data: { documentId, update: Buffer.from(update), authorId },
  });
}

export function scheduleSnapshot(documentId: string, doc: Y.Doc) {
  const n = (counters.get(documentId) ?? 0) + 1;
  counters.set(documentId, n);

  if (n >= SNAPSHOT_THRESHOLD) {
    void snapshot(documentId, doc);
    return;
  }

  if (timers.has(documentId)) return;
  timers.set(
    documentId,
    setTimeout(() => {
      void snapshot(documentId, doc);
    }, SNAPSHOT_INTERVAL_MS),
  );
}

async function snapshot(documentId: string, doc: Y.Doc) {
  const state = Y.encodeStateAsUpdate(doc);
  const stateVec = Y.encodeStateVector(doc);
  await prisma.document.update({
    where: { id: documentId },
    data: { yDoc: Buffer.from(state), yStateVec: Buffer.from(stateVec) },
  });
  counters.set(documentId, 0);
  const timer = timers.get(documentId);
  if (timer) {
    clearTimeout(timer);
    timers.delete(documentId);
  }
}
