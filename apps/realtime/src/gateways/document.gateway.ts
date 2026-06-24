import type { Server, Socket } from 'socket.io';
import * as Y from 'yjs';

import type { Logger } from '@collab/logger';

import { loadDocument, persistUpdate, scheduleSnapshot } from '../yjs/persistence';

// Yjs sync protocol over Socket.IO:
//
//   client → 'doc:join'        with its state vector → server replies 'doc:sync'
//   server → 'doc:sync'        {update, stateVector} → diff the client is missing
//                              + the server's own vector so the client can reply
//   client → 'doc:update'      with binary update → server broadcasts + persists
//   client → 'doc:awareness'   with awareness state → server broadcasts (not persisted)
//
// This is a two-way state-vector exchange (the same handshake y-protocols/sync
// performs): each side sends the other only the ops it lacks, so a client that
// reconnects after editing offline converges in a single round-trip.
//
// Each document has an in-memory Y.Doc per pod. The Redis adapter ensures
// updates fan out across pods; the per-pod doc keeps the state vector hot.

const inMemoryDocs = new Map<string, Y.Doc>();

async function getDoc(documentId: string): Promise<Y.Doc> {
  let doc = inMemoryDocs.get(documentId);
  if (!doc) {
    doc = new Y.Doc();
    const snapshot = await loadDocument(documentId);
    if (snapshot) Y.applyUpdate(doc, snapshot);
    inMemoryDocs.set(documentId, doc);
  }
  return doc;
}

export function registerDocumentGateway(io: Server, logger: Logger) {
  io.on('connection', (socket: Socket) => {
    const user = socket.data.user;
    if (!user) return socket.disconnect();

    socket.on(
      'doc:join',
      async ({ documentId, stateVector }: { documentId: string; stateVector?: number[] }) => {
        // TODO: re-check ACL via API call (cached in Redis 60s)
        const room = `doc:${documentId}`;
        await socket.join(room);
        const doc = await getDoc(documentId);

        // Diff the client is missing, computed from the state vector it sent.
        // (Empty/absent vector → full state, e.g. a brand-new client.)
        const clientVector = stateVector ? new Uint8Array(stateVector) : undefined;
        const update = Y.encodeStateAsUpdate(doc, clientVector);

        socket.emit('doc:sync', {
          documentId,
          update: Array.from(update),
          stateVector: Array.from(Y.encodeStateVector(doc)),
        });
      },
    );

    socket.on(
      'doc:update',
      async ({ documentId, update }: { documentId: string; update: number[] }) => {
        try {
          const doc = await getDoc(documentId);
          const updateBuf = new Uint8Array(update);
          Y.applyUpdate(doc, updateBuf);
          socket.to(`doc:${documentId}`).emit('doc:update', { update });
          await persistUpdate(documentId, updateBuf, user.sub);
          scheduleSnapshot(documentId, doc);
        } catch (err) {
          logger.warn({ err, documentId }, 'rejected malformed update');
        }
      },
    );

    socket.on(
      'doc:awareness',
      ({ documentId, state }: { documentId: string; state: unknown }) => {
        socket.to(`doc:${documentId}`).emit('doc:awareness', { from: user.sub, state });
      },
    );

    socket.on('disconnect', () => {
      // awareness GC happens in the presence gateway
    });
  });
}
