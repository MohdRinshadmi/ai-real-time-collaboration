import * as aiService from '../services/ai.service';
import { asyncHandler } from '../utils/async-handler';

export const listConversations = asyncHandler(async (req, res) => {
  res.json(await aiService.listConversations(req.user.id));
});
