import * as channelService from '../services/channel.service';
import * as messageService from '../services/message.service';
import { asyncHandler } from '../utils/async-handler';

export const list = asyncHandler(async (req, res) => {
  res.json(await channelService.list(req.query.workspaceId));
});

export const create = asyncHandler(async (req, res) => {
  const channel = await channelService.create(req.body.workspaceId, req.body.name, req.body.type);
  res.status(201).json(channel);
});

// --- Nested messages (/channels/:channelId/messages) ---
export const listMessages = asyncHandler(async (req, res) => {
  const { cursor, limit } = req.query;
  res.json(await messageService.list(req.params.channelId, cursor, limit));
});

export const sendMessage = asyncHandler(async (req, res) => {
  const msg = await messageService.send({
    channelId: req.params.channelId,
    authorId: req.user.id,
    content: req.body.content,
    threadId: req.body.threadId,
  });
  res.status(201).json(msg);
});
