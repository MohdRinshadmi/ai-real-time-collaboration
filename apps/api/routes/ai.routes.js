import { Router } from 'express';

import * as ai from '../controllers/ai.controller';
import { authenticate } from '../middleware/authenticate';

const router = Router();

router.use(authenticate);
router.get('/conversations', ai.listConversations);

export default router;
