import * as Y from 'yjs';

import type {SocketClient} from '@/api';

import {
  appendPendingUpdate,
  clearPendingUpdate,
  loadDocState,
  loadPendingUpdate,
  saveDocState,
} from './persistence';

// Mobile counterpart of the web app's `y-websocket` WebsocketProvider
// (see apps/web/src/features/editor/hooks/useYDoc.ts). There's no off-the-shelf
// RN provider that speaks our Socket.IO sync protocol, so this is hand-rolled
// against the realtime service's doc:* events:
//
//   client → doc:join      {documentId, stateVector}  request the server diff
//   server → doc:sync      {documentId, update, stateVector}
//   client → doc:update    {documentId, update}        local edits
//   server → doc:update    {update}                     remote edits (fan-out)
//   client ⇄ doc:awareness {documentId, state}          presence / typing
//
// Offline-first contract:
//   - On open, the doc is hydrated from MMKV synchronously — editable before
//     any network round-trip.
//   - While disconnected, local edits are merged into a pending buffer in MMKV.
//   - On (re)connect we sync with the server, flush the pending buffer, and the
//     CRDT reconciles automatically. No edits are lost across app restarts.

export type ConnectionStatus = 'offline' | 'connecting' | 'connected';

export type PeerState = {
  user: {id: string; name: string; color: string};
  typing?: boolean;
  cursor?: number;
};

type Listener<T> = (value: T) => void;

const ORIGIN = Symbol('yjs-provider-remote');

export type YjsUser = {id: string; name: string; color: string};

export class YjsProvider {
  readonly doc = new Y.Doc();
  private status: ConnectionStatus = 'offline';
  private localAwareness: PeerState;
  private readonly peers = new Map<string, PeerState>();

  private readonly statusListeners = new Set<Listener<ConnectionStatus>>();
  private readonly awarenessListeners = new Set<Listener<Map<string, PeerState>>>();
  private readonly cleanups: Array<() => void> = [];

  constructor(
    private readonly documentId: string,
    user: YjsUser,
    private readonly socket: SocketClient,
  ) {
    this.localAwareness = {user};

    // 1. Hydrate from disk first — instant, offline-capable open.
    const snapshot = loadDocState(documentId);
    if (snapshot) Y.applyUpdate(this.doc, snapshot, ORIGIN);
    const pending = loadPendingUpdate(documentId);
    if (pending) Y.applyUpdate(this.doc, pending, ORIGIN);

    // 2. Persist + propagate every local edit.
    this.doc.on('update', this.handleDocUpdate);

    // 3. Wire socket events (re-bound across reconnects by SocketClient).
    this.cleanups.push(this.socket.on('doc:sync', this.handleSync));
    this.cleanups.push(this.socket.on('doc:update', this.handleRemoteUpdate));
    this.cleanups.push(this.socket.on('doc:awareness', this.handleRemoteAwareness));
    this.cleanups.push(this.socket.onStatus(this.handleConnectionChange));
  }

  /** The shared rich-text field. Bind a TextInput to this. */
  text(field = 'content'): Y.Text {
    return this.doc.getText(field);
  }

  getStatus(): ConnectionStatus {
    return this.status;
  }

  getPeers(): Map<string, PeerState> {
    return this.peers;
  }

  onStatus(cb: Listener<ConnectionStatus>): () => void {
    this.statusListeners.add(cb);
    cb(this.status);
    return () => this.statusListeners.delete(cb);
  }

  onAwareness(cb: Listener<Map<string, PeerState>>): () => void {
    this.awarenessListeners.add(cb);
    cb(this.peers);
    return () => this.awarenessListeners.delete(cb);
  }

  /** Update + broadcast our presence (e.g. typing indicator, cursor). */
  setAwareness(partial: Partial<Omit<PeerState, 'user'>>): void {
    this.localAwareness = {...this.localAwareness, ...partial};
    if (this.status === 'connected') {
      this.socket.emit('doc:awareness', {
        documentId: this.documentId,
        state: this.localAwareness,
      });
    }
  }

  destroy(): void {
    // Tell peers we're gone, then tear everything down.
    if (this.status === 'connected') {
      this.socket.emit('doc:awareness', {documentId: this.documentId, state: null});
    }
    this.doc.off('update', this.handleDocUpdate);
    for (const cleanup of this.cleanups) cleanup();
    this.cleanups.length = 0;
    this.statusListeners.clear();
    this.awarenessListeners.clear();
    this.doc.destroy();
  }

  // --- internal handlers (arrow fns to keep `this`) -------------------------

  private handleDocUpdate = (update: Uint8Array, origin: unknown) => {
    // Always persist the latest snapshot so a cold start is current.
    saveDocState(this.documentId, this.doc);

    if (origin === ORIGIN) return; // came from server/disk — don't echo back

    if (this.status === 'connected') {
      this.socket.emit('doc:update', {
        documentId: this.documentId,
        update: Array.from(update),
      });
    } else {
      // Offline: stash the edit to replay on reconnect.
      appendPendingUpdate(this.documentId, update);
    }
  };

  private handleConnectionChange = (connected: boolean) => {
    if (connected) {
      this.setStatus('connecting');
      // Ask the server for everything we're missing since our last state.
      this.socket.emit('doc:join', {
        documentId: this.documentId,
        stateVector: Array.from(Y.encodeStateVector(this.doc)),
      });
    } else {
      this.setStatus('offline');
    }
  };

  private handleSync = (payload: {
    documentId: string;
    update?: number[];
    stateVector?: number[];
  }) => {
    if (payload.documentId !== this.documentId) return;

    // Apply the server's diff (state we were missing).
    if (payload.update?.length) {
      Y.applyUpdate(this.doc, new Uint8Array(payload.update), ORIGIN);
    }

    // Send the server everything *it* is missing from us.
    if (payload.stateVector) {
      const diff = Y.encodeStateAsUpdate(this.doc, new Uint8Array(payload.stateVector));
      if (diff.length) {
        this.socket.emit('doc:update', {
          documentId: this.documentId,
          update: Array.from(diff),
        });
      }
    }

    // Flush any edits made while offline, then clear the queue.
    const pending = loadPendingUpdate(this.documentId);
    if (pending?.length) {
      this.socket.emit('doc:update', {
        documentId: this.documentId,
        update: Array.from(pending),
      });
    }
    clearPendingUpdate(this.documentId);

    this.setStatus('connected');
    // Re-announce presence now that we're live.
    this.socket.emit('doc:awareness', {
      documentId: this.documentId,
      state: this.localAwareness,
    });
  };

  private handleRemoteUpdate = (payload: {documentId?: string; update: number[]}) => {
    if (payload.documentId && payload.documentId !== this.documentId) return;
    Y.applyUpdate(this.doc, new Uint8Array(payload.update), ORIGIN);
  };

  private handleRemoteAwareness = (payload: {from: string; state: PeerState | null}) => {
    if (payload.state === null) {
      this.peers.delete(payload.from);
    } else {
      this.peers.set(payload.from, payload.state);
    }
    this.emitAwareness();
  };

  private setStatus(status: ConnectionStatus) {
    if (this.status === status) return;
    this.status = status;
    for (const cb of this.statusListeners) cb(status);
  }

  private emitAwareness() {
    for (const cb of this.awarenessListeners) cb(this.peers);
  }
}
