import rateLimit from 'express-rate-limit';

// Replaces NestJS ThrottlerModule. `apiLimiter` is the broad default; tighter
// limiters guard sensitive endpoints (e.g. auth) against brute force.
const json429 = (_req, res) =>
  res.status(429).json({ error: 'too_many_requests', requestId: res.req.requestId });

export const apiLimiter = rateLimit({
  windowMs: 60_000,
  limit: 300,
  standardHeaders: true,
  legacyHeaders: false,
  handler: json429,
});

export const authLimiter = rateLimit({
  windowMs: 60_000,
  limit: 5,
  standardHeaders: true,
  legacyHeaders: false,
  handler: json429,
});
