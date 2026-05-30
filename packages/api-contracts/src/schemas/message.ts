import { z } from 'zod';

import { paginationInputSchema } from './common';

export const sendMessageInputSchema = z.object({
  channelId: z.string(),
  content: z.unknown(), // ProseMirror JSON — validated by editor
  threadId: z.string().nullish(),
});

export const listMessagesInputSchema = paginationInputSchema.extend({
  channelId: z.string(),
  threadId: z.string().nullish(),
});

export const addReactionInputSchema = z.object({
  messageId: z.string(),
  emoji: z.string().min(1).max(16),
});

export type SendMessageInput = z.infer<typeof sendMessageInputSchema>;
