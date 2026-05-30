import * as healthService from '../services/health.service';
import { asyncHandler } from '../utils/async-handler';

// Liveness — the process is alive (always 200 while it can respond).
export function liveness(_req, res) {
  res.json({ status: 'ok' });
}

// Readiness — DB + Redis reachable; gates traffic in k8s.
export const readiness = asyncHandler(async (_req, res) => {
  res.json(await healthService.checkReadiness());
});
