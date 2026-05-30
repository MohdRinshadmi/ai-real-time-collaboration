import { z } from 'zod';

// Domain events published to Kafka via the outbox pattern.
// Every event includes a unique id for consumer-side deduplication.

const baseEvent = z.object({
  id: z.string(),
  occurredAt: z.string().datetime(),
  workspaceId: z.string(),
  actorId: z.string().nullable(),
  correlationId: z.string().optional(),
});

export const documentCreatedEvent = baseEvent.extend({
  type: z.literal('document.created'),
  payload: z.object({ documentId: z.string(), title: z.string(), parentId: z.string().nullable() }),
});

export const documentUpdatedEvent = baseEvent.extend({
  type: z.literal('document.updated'),
  payload: z.object({ documentId: z.string(), changedFields: z.array(z.string()) }),
});

export const documentDeletedEvent = baseEvent.extend({
  type: z.literal('document.deleted'),
  payload: z.object({ documentId: z.string() }),
});

export const memberInvitedEvent = baseEvent.extend({
  type: z.literal('member.invited'),
  payload: z.object({ email: z.string().email(), role: z.string(), invitationId: z.string() }),
});

export const messageSentEvent = baseEvent.extend({
  type: z.literal('message.sent'),
  payload: z.object({
    messageId: z.string(),
    channelId: z.string(),
    authorId: z.string(),
    mentions: z.array(z.string()),
  }),
});

export const aiCompletionFinishedEvent = baseEvent.extend({
  type: z.literal('ai.completion.finished'),
  payload: z.object({
    conversationId: z.string(),
    promptTokens: z.number(),
    completionTokens: z.number(),
    costUsd: z.number(),
    model: z.string(),
  }),
});

export const domainEvent = z.discriminatedUnion('type', [
  documentCreatedEvent,
  documentUpdatedEvent,
  documentDeletedEvent,
  memberInvitedEvent,
  messageSentEvent,
  aiCompletionFinishedEvent,
]);

export type DomainEvent = z.infer<typeof domainEvent>;
export type DocumentCreated = z.infer<typeof documentCreatedEvent>;
export type MemberInvited = z.infer<typeof memberInvitedEvent>;
export type MessageSent = z.infer<typeof messageSentEvent>;

export const TOPICS = {
  DOCUMENTS: 'collab.documents.v1',
  MEMBERS: 'collab.members.v1',
  MESSAGES: 'collab.messages.v1',
  AI: 'collab.ai.v1',
} as const;
