// Cross-package primitive types. Domain entities live in @collab/db (Prisma).

export type Brand<T, B extends string> = T & { readonly __brand: B };

export type UserId = Brand<string, 'UserId'>;
export type WorkspaceId = Brand<string, 'WorkspaceId'>;
export type DocumentId = Brand<string, 'DocumentId'>;
export type ChannelId = Brand<string, 'ChannelId'>;
export type MessageId = Brand<string, 'MessageId'>;

export type Cursor = Brand<string, 'Cursor'>;

export type Paginated<T> = {
  items: T[];
  nextCursor: Cursor | null;
  hasMore: boolean;
};

export type RequestContext = {
  userId: UserId;
  workspaceId: WorkspaceId;
  requestId: string;
  ip?: string;
  userAgent?: string;
};

export type SuccessResult<T> = { ok: true; data: T };
export type FailureResult<E = string> = { ok: false; error: E };
export type Result<T, E = string> = SuccessResult<T> | FailureResult<E>;
