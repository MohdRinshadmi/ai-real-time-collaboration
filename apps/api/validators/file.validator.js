import { z } from 'zod';

export const createUploadUrlSchema = z.object({
  workspaceId: z.string(),
  filename: z.string().min(1).max(255),
  mimeType: z.string().min(1),
  sizeBytes: z.coerce.number().int().positive(),
});
