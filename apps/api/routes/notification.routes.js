import { Router } from 'express';

import * as notification from '../controllers/notification.controller';
import { authenticate } from '../middleware/authenticate';
import { validate } from '../middleware/validate';
import { markReadSchema } from '../validators/notification.validator';

const router = Router();

router.use(authenticate);
router.get('/', notification.list);
router.patch('/read', validate(markReadSchema), notification.markRead);

export default router;
