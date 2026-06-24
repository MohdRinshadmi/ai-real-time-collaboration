import type { Server, Socket } from 'socket.io';

import type { Logger } from '@collab/logger';

import { buildIceServers } from '../webrtc/ice';

// WebRTC signaling relay for in-document / in-channel voice ("huddles").
//
// The realtime service never touches the media itself — it only brokers the
// SDP offer/answer handshake and trickled ICE candidates between peers. Once
// the handshake completes, audio flows peer-to-peer (or via TURN). This is the
// mesh model: fine for small rooms; an SFU would replace it past ~6 peers.
//
//   client → 'rtc:join'   {room}            join the mesh; gets ICE config + peer list
//   server → 'rtc:peers'  {iceServers, peers}
//   server → 'rtc:peer-joined' {peerId}     existing peers create an offer
//   client → 'rtc:offer'  {to, sdp}    ─┐
//   client → 'rtc:answer' {to, sdp}     ├─ relayed verbatim to `to`
//   client → 'rtc:ice'    {to, candidate}┘
//   server → 'rtc:peer-left' {peerId}       on leave/disconnect

export function registerWebRTCGateway(io: Server, logger: Logger) {
  io.on('connection', (socket: Socket) => {
    const joined = new Set<string>();

    socket.on('rtc:join', async ({ room }: { room: string }) => {
      const channel = `rtc:${room}`;
      // Peers already in the mesh — the newcomer offers to each of them.
      const existing = [...(await io.in(channel).allSockets())];
      await socket.join(channel);
      joined.add(room);

      socket.emit('rtc:peers', {
        room,
        iceServers: buildIceServers(),
        peers: existing,
      });
      socket.to(channel).emit('rtc:peer-joined', { room, peerId: socket.id });
      logger.debug({ room, peerId: socket.id, peers: existing.length }, 'rtc join');
    });

    const relay = (event: 'rtc:offer' | 'rtc:answer' | 'rtc:ice') =>
      socket.on(event, ({ to, ...rest }: { to: string }) => {
        // Targeted relay: each socket auto-joins a room named by its own id.
        io.to(to).emit(event, { from: socket.id, ...rest });
      });
    relay('rtc:offer');
    relay('rtc:answer');
    relay('rtc:ice');

    const leave = (room: string) => {
      const channel = `rtc:${room}`;
      socket.to(channel).emit('rtc:peer-left', { room, peerId: socket.id });
      void socket.leave(channel);
      joined.delete(room);
    };

    socket.on('rtc:leave', ({ room }: { room: string }) => leave(room));
    socket.on('disconnect', () => {
      for (const room of joined) leave(room);
    });
  });
}
