export type Role = 'OWNER' | 'ADMIN' | 'MEMBER' | 'GUEST';
export type Action =
  | 'workspace.delete'
  | 'workspace.update'
  | 'member.invite'
  | 'member.remove'
  | 'member.update-role'
  | 'document.create'
  | 'document.delete'
  | 'document.share'
  | 'channel.create'
  | 'channel.archive'
  | 'billing.manage'
  | 'ai.use';

// Role → allowed actions matrix. Resource-level ACLs layer on top of this
// for documents/channels.
const matrix: Record<Role, ReadonlySet<Action>> = {
  OWNER: new Set<Action>([
    'workspace.delete',
    'workspace.update',
    'member.invite',
    'member.remove',
    'member.update-role',
    'document.create',
    'document.delete',
    'document.share',
    'channel.create',
    'channel.archive',
    'billing.manage',
    'ai.use',
  ]),
  ADMIN: new Set<Action>([
    'workspace.update',
    'member.invite',
    'member.remove',
    'member.update-role',
    'document.create',
    'document.delete',
    'document.share',
    'channel.create',
    'channel.archive',
    'ai.use',
  ]),
  MEMBER: new Set<Action>([
    'document.create',
    'document.share',
    'channel.create',
    'ai.use',
  ]),
  GUEST: new Set<Action>(['ai.use']),
};

export function can(role: Role, action: Action): boolean {
  return matrix[role].has(action);
}

export function assertCan(role: Role, action: Action): void {
  if (!can(role, action)) {
    throw new ForbiddenError(`Role ${role} cannot perform ${action}`);
  }
}

export class ForbiddenError extends Error {
  override readonly name = 'ForbiddenError';
}
