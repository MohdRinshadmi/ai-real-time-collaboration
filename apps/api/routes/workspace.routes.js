import { Router } from 'express';

import * as workspace from '../controllers/workspace.controller';
import { authenticate } from '../middleware/authenticate';
import { validate } from '../middleware/validate';
import { createWorkspaceSchema } from '../validators/workspace.validator';

const router = Router();

router.use(authenticate);
router.get('/', workspace.list);
router.post('/', validate(createWorkspaceSchema), workspace.create);

export default router;
