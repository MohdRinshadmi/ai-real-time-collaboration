import { Router } from 'express';

import { apiLimiter } from '../middleware/rate-limit';

import aiRoutes from './ai.routes';
import authRoutes from './auth.routes';
import channelRoutes from './channel.routes';
import documentRoutes from './document.routes';
import fileRoutes from './file.routes';
import healthRoutes from './health.routes';
import notificationRoutes from './notification.routes';
import workspaceRoutes from './workspace.routes';

const router = Router();

// Health probes are mounted before the rate limiter so k8s checks are never
// throttled.
router.use('/', healthRoutes);

// Broad rate limit on everything below.
router.use(apiLimiter);

router.use('/auth', authRoutes);
router.use('/workspaces', workspaceRoutes);
router.use('/documents', documentRoutes);
router.use('/channels', channelRoutes);
router.use('/files', fileRoutes);
router.use('/ai', aiRoutes);
router.use('/notifications', notificationRoutes);

export default router;
