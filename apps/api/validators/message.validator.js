import { z } from 'zod';

export const sendMessageSchema = z.object({
  content: z.unknown().refine((v) => v != null, 'content is required'),
  threadId: z.string().optional(),
});

export const listMessagesSchema = z.object({
  cursor: z.string().optional(),
  limit: z.coerce.number().min(1).max(100).default(50),
});
