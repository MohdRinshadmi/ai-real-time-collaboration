import { Router } from 'express';

import * as document from '../controllers/document.controller';
import { authenticate } from '../middleware/authenticate';
import { requireWorkspace } from '../middleware/workspace';
import { validate } from '../middleware/validate';
import { createDocumentSchema, listDocumentsSchema } from '../validators/document.validator';

const router = Router();

router.use(authenticate, requireWorkspace);
router.get('/', validate(listDocumentsSchema, 'query'), document.list);
router.get('/:id', document.get);
router.post('/', validate(createDocumentSchema), document.create);

export default router;
