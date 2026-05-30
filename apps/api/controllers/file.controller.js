import * as fileService from '../services/file.service';
import { asyncHandler } from '../utils/async-handler';

export const createUploadUrl = asyncHandler(async (req, res) => {
  const result = await fileService.createUploadUrl({ ...req.body, uploadedBy: req.user.id });
  res.status(201).json(result);
});
