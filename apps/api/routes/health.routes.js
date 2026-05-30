import { Router } from 'express';

import * as health from '../controllers/health.controller';

const router = Router();

router.get('/healthz', health.liveness);
router.get('/readyz', health.readiness);

export default router;
