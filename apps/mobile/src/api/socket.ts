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

export type RoomEvent = {v: number; type: string; [k: string]: unknown};

export class SocketClient {
  private socket: Socket | null = null;
  private subscriptions = new Map<string, Set<(e: RoomEvent) => void>>();

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
    this.socket.io.on('reconnect', () => this.replaySubscriptions());
  }

  disconnect() {
    this.socket?.disconnect();
    this.socket = null;
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

  emit<T>(event: string, payload: T) {
    this.socket?.emit(event, payload);
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
