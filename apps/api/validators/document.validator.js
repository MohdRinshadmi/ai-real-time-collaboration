import { z } from 'zod';

export const createDocumentSchema = z.object({
  workspaceId: z.string(),
  title: z.string().min(1).max(200).default('Untitled'),
  parentId: z.string().nullish(),
  icon: z.string().max(8).nullish(),
});

export const listDocumentsSchema = z.object({
  workspaceId: z.string(),
  parentId: z.string().nullish(),
  cursor: z.string().optional(),
  limit: z.coerce.number().min(1).max(100).default(20),
});
