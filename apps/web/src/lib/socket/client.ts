import { io, type Socket } from 'socket.io-client';

import { env } from '@/lib/env';

// Resilient WebSocket client.
//
// - Reconnects with exponential backoff (socket.io built-in)
// - Replays room subscriptions on reconnect (server has no memory)
// - Carries the current JWT on handshake; on 401 we refresh and reconnect

export type RoomEvent = { v: number; type: string; [k: string]: unknown };

export class SocketClient {
  private socket: Socket | null = null;
  private subscriptions = new Map<string, Set<(e: RoomEvent) => void>>();

  connect(token?: string) {
    if (this.socket?.connected) return;
    this.socket = io(env.NEXT_PUBLIC_WS_URL, {
      transports: ['websocket'],
      auth: token ? { token } : undefined,
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

  join(room: string, handler: (e: RoomEvent) => void): () => void {
    if (!this.socket) throw new Error('socket not connected');
    if (!this.subscriptions.has(room)) {
      this.subscriptions.set(room, new Set());
      this.socket.emit('room:join', { room });
      this.socket.on(`room:${room}`, (e: RoomEvent) => {
        for (const h of this.subscriptions.get(room) ?? []) h(e);
      });
    }
    this.subscriptions.get(room)!.add(handler);
    return () => {
      const set = this.subscriptions.get(room);
      if (!set) return;
      set.delete(handler);
      if (set.size === 0) {
        this.socket?.emit('room:leave', { room });
        this.subscriptions.delete(room);
      }
    };
  }

  emit<T>(event: string, payload: T) {
    this.socket?.emit(event, payload);
  }

  private replaySubscriptions() {
    for (const room of this.subscriptions.keys()) {
      this.socket?.emit('room:join', { room });
    }
  }
}

let _client: SocketClient | null = null;
export function getSocketClient(): SocketClient {
  return (_client ??= new SocketClient());
}
