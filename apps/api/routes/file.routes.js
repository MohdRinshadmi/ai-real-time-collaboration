import { Router } from 'express';

import * as file from '../controllers/file.controller';
import { authenticate } from '../middleware/authenticate';
import { requireWorkspace } from '../middleware/workspace';
import { validate } from '../middleware/validate';
import { createUploadUrlSchema } from '../validators/file.validator';

const router = Router();

router.use(authenticate, requireWorkspace);
router.post('/upload-url', validate(createUploadUrlSchema), file.createUploadUrl);

export default router;
