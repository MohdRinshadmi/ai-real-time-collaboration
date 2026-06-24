import { createAdapter } from '@socket.io/redis-adapter';
import Fastify from 'fastify';
import Redis from 'ioredis';
import { Server } from 'socket.io';

import { createLogger } from '@collab/logger';

import { registerDocumentGateway } from './gateways/document.gateway';
import { registerPresenceGateway } from './gateways/presence.gateway';
import { registerWebRTCGateway } from './gateways/webrtc.gateway';
import { authenticateSocket } from './auth/socket-auth';
import { buildIceServers } from './webrtc/ice';

const logger = createLogger({ service: 'realtime', pretty: process.env.NODE_ENV !== 'production' });

async function bootstrap() {
  const app = Fastify({ logger: false, trustProxy: true });

  app.get('/healthz', () => ({ status: 'ok' }));

  // WebRTC clients fetch ICE (STUN/TURN) config over HTTP before joining a mesh.
  app.get('/ice-servers', () => ({ iceServers: buildIceServers() }));

  const httpServer = app.server;
  const io = new Server(httpServer, {
    cors: {
      origin: process.env.CORS_ORIGINS?.split(',') ?? ['http://localhost:3000'],
      credentials: true,
    },
    transports: ['websocket'],
    pingInterval: 25_000,
    pingTimeout: 60_000,
    maxHttpBufferSize: 1024 * 1024, // 1MB — caps malicious payloads
  });

  // Redis adapter → fans out events across pods. Sticky LB still required so
  // a single client stays on the same pod between requests.
  const pub = new Redis(process.env.REDIS_PUBSUB_URL ?? process.env.REDIS_URL!);
  const sub = pub.duplicate();
  io.adapter(createAdapter(pub, sub));

  // Auth runs on the connection handshake. Authorization is re-checked on
  // every room-join (defense in depth).
  io.use(authenticateSocket);

  registerDocumentGateway(io, logger);
  registerPresenceGateway(io, logger);
  registerWebRTCGateway(io, logger);

  const port = Number(process.env.PORT ?? 4001);
  await app.listen({ port, host: '0.0.0.0' });
  logger.info({ port }, 'Realtime listening');
}

bootstrap().catch((err) => {
  logger.error({ err }, 'Bootstrap failed');
  process.exit(1);
});
