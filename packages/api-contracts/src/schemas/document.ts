import { z } from 'zod';

import { paginationInputSchema } from './common';

export const createDocumentInputSchema = z.object({
  workspaceId: z.string(),
  title: z.string().min(1).max(200).default('Untitled'),
  parentId: z.string().nullish(),
  icon: z.string().max(8).nullish(),
});

export const updateDocumentInputSchema = z.object({
  id: z.string(),
  title: z.string().min(1).max(200).optional(),
  icon: z.string().max(8).nullish().optional(),
  parentId: z.string().nullish().optional(),
});

export const listDocumentsInputSchema = paginationInputSchema.extend({
  workspaceId: z.string(),
  parentId: z.string().nullish(),
});

export const aclSchema = z.object({
  documentId: z.string(),
  subjectType: z.enum(['USER', 'ROLE', 'PUBLIC']),
  subjectId: z.string(),
  permission: z.enum(['VIEW', 'COMMENT', 'EDIT', 'ADMIN']),
});

export type CreateDocumentInput = z.infer<typeof createDocumentInputSchema>;
export type UpdateDocumentInput = z.infer<typeof updateDocumentInputSchema>;
