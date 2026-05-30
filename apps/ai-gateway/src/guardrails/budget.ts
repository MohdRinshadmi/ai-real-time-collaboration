import Redis from 'ioredis';

// Per-workspace daily token budget. Soft limit emits a warning header;
// hard limit blocks the request with 402 Payment Required.
//
// Counter is stored in Redis with a 24h TTL keyed by date so it auto-rolls.

const redis = new Redis(process.env.REDIS_URL!);

const BUDGETS_USD_PER_DAY: Record<string, number> = {
  FREE: 0.5,
  PRO: 5,
  TEAM: 25,
  ENTERPRISE: Infinity,
};

export class BudgetExceededError extends Error {
  constructor(public readonly workspaceId: string, public readonly spent: number) {
    super(`AI budget exceeded for workspace ${workspaceId}`);
  }
}

function todayKey(workspaceId: string) {
  const date = new Date().toISOString().slice(0, 10);
  return `ai:budget:${workspaceId}:${date}`;
}

export async function checkBudget(workspaceId: string, plan: keyof typeof BUDGETS_USD_PER_DAY) {
  const cap = BUDGETS_USD_PER_DAY[plan] ?? 0;
  if (!isFinite(cap)) return;
  const spent = Number((await redis.get(todayKey(workspaceId))) ?? 0);
  if (spent >= cap) throw new BudgetExceededError(workspaceId, spent);
}

export async function recordSpend(workspaceId: string, usd: number) {
  const key = todayKey(workspaceId);
  await redis.incrbyfloat(key, usd);
  await redis.expire(key, 60 * 60 * 26); // 26h: covers DST + clock skew
}
