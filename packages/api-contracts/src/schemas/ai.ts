import { z } from 'zod';

export const aiPipelineSchema = z.enum([
  'summarize',
  'extract-tasks',
  'meeting-notes',
  'chat',
  'inline-suggest',
]);

export const aiChatInputSchema = z.object({
  conversationId: z.string().nullish(),
  workspaceId: z.string(),
  message: z.string().min(1).max(8000),
  contextDocId: z.string().nullish(),
  ragEnabled: z.boolean().default(true),
});

export const aiSummarizeInputSchema = z.object({
  documentId: z.string(),
  length: z.enum(['short', 'medium', 'long']).default('medium'),
});

export const aiExtractTasksInputSchema = z.object({
  documentId: z.string(),
});

export const aiInlineActionSchema = z.enum(['improve', 'explain', 'shorten', 'summarize']);

export const aiInlineInputSchema = z.object({
  workspaceId: z.string(),
  action: aiInlineActionSchema,
  selection: z.string().min(1).max(8000),
});

export const aiCitationSchema = z.object({
  documentId: z.string(),
  chunkIndex: z.number().int(),
  score: z.number(),
  excerpt: z.string(),
});

export type AIPipeline = z.infer<typeof aiPipelineSchema>;
export type AIChatInput = z.infer<typeof aiChatInputSchema>;
export type AICitation = z.infer<typeof aiCitationSchema>;
export type AIInlineAction = z.infer<typeof aiInlineActionSchema>;
export type AIInlineInput = z.infer<typeof aiInlineInputSchema>;
