import {io, type Socket} from 'socket.io-client';

import {env} from '@/config';
import {getCachedAccessToken} from '@/services/tokenStore';

// Mobile port of apps/web/src/lib/socket/client.ts.
//
// Behaviour preserved from web:
// - Reconnect with exponential backoff (socket.io built-in)
// - Replay room subscriptions on reconnect (server is stateless)
// - Carry the current JWT on the handshake
//
// Mobile addition: the OS suspends sockets when the app is backgrounded, so the
// AppState listener in SocketProvider drives connect()/disconnect().
//
// This client multiplexes three workloads over one connection:
//   1. room:* fan-out events (chat, presence)         — join()/emit()
//   2. Yjs document sync (doc:*)                        — on()/emit()
//   3. WebRTC signaling (rtc:*)                         — on()/emit()
// Because connect()/disconnect() may tear down and recreate the underlying
// socket (backgrounding), arbitrary listeners registered via on() are tracked
// and re-bound automatically whenever a fresh socket is created.

export type RoomEvent = {v: number; type: string; [k: string]: unknown};
// Socket.IO payloads are dynamically typed on the wire; each consumer narrows
// its own payload shape (see YjsProvider / WebRTCRoom).
type AnyHandler = (...args: any[]) => void;
type StatusHandler = (connected: boolean) => void;

export class SocketClient {
  private socket: Socket | null = null;
  private subscriptions = new Map<string, Set<(e: RoomEvent) => void>>();
  private eventHandlers = new Map<string, Set<AnyHandler>>();
  private statusHandlers = new Set<StatusHandler>();

  connect(token?: string) {
    if (this.socket?.connected) return;
    const auth = token ?? getCachedAccessToken();
    this.socket = io(env.WS_URL, {
      transports: ['websocket'],
      auth: auth ? {token: auth} : undefined,
      reconnectionDelayMax: 10_000,
      reconnectionAttempts: Infinity,
      timeout: 15_000,
    });

    // Re-apply every persistent listener to the new socket instance.
    for (const [event, handlers] of this.eventHandlers) {
      for (const h of handlers) this.socket.on(event, h);
    }

    this.socket.on('connect', () => {
      this.replaySubscriptions();
      this.notifyStatus(true);
    });
    this.socket.on('disconnect', () => this.notifyStatus(false));
    this.socket.io.on('reconnect', () => {
      this.replaySubscriptions();
      this.notifyStatus(true);
    });
  }

  disconnect() {
    this.socket?.disconnect();
    this.socket = null;
    this.notifyStatus(false);
  }

  isConnected(): boolean {
    return this.socket?.connected ?? false;
  }

  join(room: string, handler: (e: RoomEvent) => void): () => void {
    if (!this.socket) {
      // Tolerate joins issued before the socket is up (e.g. on cold start);
      // the subscription is recorded and replayed once connected.
      this.connect();
    }
    if (!this.subscriptions.has(room)) {
      this.subscriptions.set(room, new Set());
      this.socket?.emit('room:join', {room});
      this.socket?.on(`room:${room}`, (e: RoomEvent) => {
        for (const h of this.subscriptions.get(room) ?? []) h(e);
      });
    }
    this.subscriptions.get(room)!.add(handler);
    return () => {
      const set = this.subscriptions.get(room);
      if (!set) return;
      set.delete(handler);
      if (set.size === 0) {
        this.socket?.emit('room:leave', {room});
        this.subscriptions.delete(room);
      }
    };
  }

  // Subscribe to a raw socket event (doc:*, rtc:*). The handler survives
  // reconnects/backgrounding. Returns an unsubscribe fn.
  on(event: string, handler: AnyHandler): () => void {
    if (!this.eventHandlers.has(event)) this.eventHandlers.set(event, new Set());
    this.eventHandlers.get(event)!.add(handler);
    this.socket?.on(event, handler);
    return () => this.off(event, handler);
  }

  off(event: string, handler: AnyHandler) {
    this.eventHandlers.get(event)?.delete(handler);
    this.socket?.off(event, handler);
  }

  // Fires immediately with the current state, then on every change.
  onStatus(handler: StatusHandler): () => void {
    this.statusHandlers.add(handler);
    handler(this.isConnected());
    return () => this.statusHandlers.delete(handler);
  }

  emit<T>(event: string, payload: T) {
    this.socket?.emit(event, payload);
  }

  private notifyStatus(connected: boolean) {
    for (const h of this.statusHandlers) h(connected);
  }

  private replaySubscriptions() {
    for (const room of this.subscriptions.keys()) {
      this.socket?.emit('room:join', {room});
    }
  }
}

let _client: SocketClient | null = null;
export function getSocketClient(): SocketClient {
  return (_client ??= new SocketClient());
}
