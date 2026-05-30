import { prisma } from '../models';
import { redis } from '../models/redis';

// Readiness probe — confirms the critical backing services are reachable.
export async function checkReadiness() {
  const [db, cache] = await Promise.allSettled([
    prisma.$queryRaw`SELECT 1`,
    redis.ping(),
  ]);
  const ok = db.status === 'fulfilled' && cache.status === 'fulfilled';
  return {
    status: ok ? 'ok' : 'degraded',
    checks: {
      database: db.status === 'fulfilled' ? 'up' : 'down',
      redis: cache.status === 'fulfilled' ? 'up' : 'down',
    },
  };
}
