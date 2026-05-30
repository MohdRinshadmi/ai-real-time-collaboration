import { Router } from 'express';

import * as channel from '../controllers/channel.controller';
import { authenticate } from '../middleware/authenticate';
import { requireWorkspace } from '../middleware/workspace';
import { validate } from '../middleware/validate';
import { createChannelSchema } from '../validators/channel.validator';
import { sendMessageSchema, listMessagesSchema } from '../validators/message.validator';

const router = Router();

router.use(authenticate, requireWorkspace);

router.get('/', channel.list);
router.post('/', validate(createChannelSchema), channel.create);

// Nested messages. The workspace is resolved from the X-Workspace-Id header.
router.get('/:channelId/messages', validate(listMessagesSchema, 'query'), channel.listMessages);
router.post('/:channelId/messages', validate(sendMessageSchema), channel.sendMessage);

export default router;
