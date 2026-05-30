import { withWorkspace } from '../models';

// 'PUBLIC' is the ChannelType enum's default value, passed as a string literal
// (Prisma accepts enum literals; @collab/db only re-exports the type).
export function create(workspaceId, name, type = 'PUBLIC') {
  return withWorkspace(workspaceId, (tx) =>
    tx.channel.create({ data: { workspaceId, name, type } }),
  );
}

export function list(workspaceId) {
  return withWorkspace(workspaceId, (tx) =>
    tx.channel.findMany({
      where: { workspaceId, archivedAt: null },
      orderBy: { name: 'asc' },
    }),
  );
}
