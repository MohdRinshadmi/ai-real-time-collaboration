import type { Server, Socket } from 'socket.io';
import * as Y from 'yjs';

import type { Logger } from '@collab/logger';

import { loadDocument, persistUpdate, scheduleSnapshot } from '../yjs/persistence';

// Yjs sync protocol over Socket.IO:
//
//   client → 'doc:sync'        with state vector → server replies with diff
//   client → 'doc:update'      with binary update → server broadcasts + persists
//   client → 'doc:awareness'   with awareness state → server broadcasts (not persisted)
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

    socket.on('doc:join', async ({ documentId }: { documentId: string }) => {
      // TODO: re-check ACL via API call (cached in Redis 60s)
      const room = `doc:${documentId}`;
      await socket.join(room);
      const doc = await getDoc(documentId);
      const stateVector = Y.encodeStateVector(doc);
      socket.emit('doc:sync', { documentId, stateVector: Array.from(stateVector) });
    });

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
