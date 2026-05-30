import Redis from 'ioredis';

import config from '../config';
import { logger } from '../utils/logger';

// Shared Redis connections. `redis` is the general client; `pub`/`sub` are
// dedicated duplicates for pub/sub (a connection in subscribe mode can't run
// normal commands). Mirrors the old RedisService.
export const redis = new Redis(config.REDIS_URL, {
  maxRetriesPerRequest: null,
  enableReadyCheck: true,
});

export const pub = redis.duplicate();
export const sub = redis.duplicate();

// Without an 'error' listener ioredis throws unhandled-error events to the
// console on every reconnect attempt. Log them quietly instead; the retry
// strategy handles recovery.
for (const [name, client] of [['redis', redis], ['pub', pub], ['sub', sub]]) {
  client.on('error', (err) => logger.debug({ err, client: name }, 'redis connection error'));
}
