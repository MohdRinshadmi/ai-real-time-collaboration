import Redis from 'ioredis';

// BullMQ connection. maxRetriesPerRequest must be null for BullMQ blocking ops.
export const connection = new Redis(process.env.REDIS_URL!, {
  maxRetriesPerRequest: null,
  enableReadyCheck: true,
});
