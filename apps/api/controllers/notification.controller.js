import * as notificationService from '../services/notification.service';
import { asyncHandler } from '../utils/async-handler';

export const list = asyncHandler(async (req, res) => {
  res.json(await notificationService.list(req.user.id, req.query.unread === 'true'));
});

export const markRead = asyncHandler(async (req, res) => {
  res.json(await notificationService.markRead(req.user.id, req.body.ids));
});
