import {MMKV} from 'react-native-mmkv';
import * as Y from 'yjs';

// Offline-first persistence for Yjs documents, backed by MMKV (a synchronous,
// memory-mapped KV store — fast enough to write on every keystroke).
//
// Two values are kept per document:
//
//   doc:<id>:state    the last full snapshot (Y.encodeStateAsUpdate). What we
//                     load instantly on open so the editor is usable offline
//                     before — or without — a network round-trip.
//
//   doc:<id>:pending  local edits made while offline, *merged* into a single
//                     update via Y.mergeUpdates. On reconnect we flush this one
//                     buffer to the server, then clear it. CRDT semantics mean
//                     replaying it after the peer has moved on still converges.
//
// MMKV's buffer API stores binary directly, so no base64 round-tripping.

const store = new MMKV({id: 'collab.yjs'});

const stateKey = (id: string) => `doc:${id}:state`;
const pendingKey = (id: string) => `doc:${id}:pending`;

function readBuffer(key: string): Uint8Array | null {
  const buf = store.getBuffer(key);
  return buf ? new Uint8Array(buf) : null;
}

// MMKV's set() takes an ArrayBuffer; a Yjs update is a Uint8Array view that may
// be backed by a larger buffer, so copy out exactly its bytes.
function writeBuffer(key: string, bytes: Uint8Array): void {
  const ab = new ArrayBuffer(bytes.byteLength);
  new Uint8Array(ab).set(bytes);
  store.set(key, ab);
}

/** Last persisted snapshot for a document, or null if never opened offline. */
export function loadDocState(documentId: string): Uint8Array | null {
  return readBuffer(stateKey(documentId));
}

/** Persist the document's full state. Call after applying remote updates. */
export function saveDocState(documentId: string, doc: Y.Doc): void {
  const state = Y.encodeStateAsUpdate(doc);
  writeBuffer(stateKey(documentId), state);
}

/** Local edits not yet confirmed by the server (merged into one update). */
export function loadPendingUpdate(documentId: string): Uint8Array | null {
  return readBuffer(pendingKey(documentId));
}

/** Merge a fresh local update into the pending queue. */
export function appendPendingUpdate(documentId: string, update: Uint8Array): void {
  const existing = loadPendingUpdate(documentId);
  const merged = existing ? Y.mergeUpdates([existing, update]) : update;
  writeBuffer(pendingKey(documentId), merged);
}

/** Drop the pending queue once it has been flushed to the server. */
export function clearPendingUpdate(documentId: string): void {
  store.delete(pendingKey(documentId));
}
