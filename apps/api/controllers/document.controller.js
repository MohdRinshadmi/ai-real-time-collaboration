import * as documentService from '../services/document.service';
import { asyncHandler } from '../utils/async-handler';

export const list = asyncHandler(async (req, res) => {
  const { workspaceId, parentId, cursor, limit } = req.query;
  res.json(await documentService.list(workspaceId, parentId ?? null, cursor, limit));
});

export const get = asyncHandler(async (req, res) => {
  res.json(await documentService.getById(req.query.workspaceId, req.params.id));
});

export const create = asyncHandler(async (req, res) => {
  const doc = await documentService.create({ ...req.body, createdBy: req.user.id });
  res.status(201).json(doc);
});
