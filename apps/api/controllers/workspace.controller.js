import * as workspaceService from '../services/workspace.service';
import { asyncHandler } from '../utils/async-handler';

export const list = asyncHandler(async (req, res) => {
  res.json(await workspaceService.listForUser(req.user.id));
});

export const create = asyncHandler(async (req, res) => {
  const workspace = await workspaceService.create({ ...req.body, ownerId: req.user.id });
  res.status(201).json(workspace);
});
