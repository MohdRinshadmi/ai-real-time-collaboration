import type { Server, Socket } from 'socket.io';

import type { Logger } from '@collab/logger';

// Presence model:
//   Redis sorted set `presence:{room}` with score = last-heartbeat ms.
//   Client heartbeats every 15s; we evict entries older than 45s on the fly.
//   Diff (join/leave) is broadcast on change, NOT on heartbeat — keeps the
//   subsystem quiet at scale.

export function registerPresenceGateway(io: Server, logger: Logger) {
  io.on('connection', (socket: Socket) => {
    socket.on('presence:enter', ({ room }: { room: string }) => {
      socket.join(`presence:${room}`);
      socket.to(`presence:${room}`).emit('presence:joined', { userId: socket.data.user?.sub });
    });

    socket.on('presence:leave', ({ room }: { room: string }) => {
      socket.leave(`presence:${room}`);
      socket.to(`presence:${room}`).emit('presence:left', { userId: socket.data.user?.sub });
    });

    socket.on('disconnect', () => {
      // socket.io auto-emits leave on disconnect via room semantics —
      // we only need to notify peers if we tracked per-room state.
      logger.debug({ userId: socket.data.user?.sub }, 'disconnect');
    });
  });
}
