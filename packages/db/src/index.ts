export { PrismaClient, Prisma } from '@prisma/client';
export type {
  User,
  Workspace,
  WorkspaceMember,
  Document,
  DocumentVersion,
  Channel,
  Message,
  Reaction,
  File,
  Notification,
  AIConversation,
  AIMessage,
  Embedding,
  Outbox,
  AuditLog,
  Plan,
  Role,
  ChannelType,
  ACLPermission,
  ACLSubjectType,
  NotificationType,
  AIMessageRole,
} from '@prisma/client';

export { createPrismaClient } from './client';
