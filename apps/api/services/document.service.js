import { withWorkspace } from '../models';
import { notFound } from '../utils/app-error';
import { paginate, buildPage } from '../helper/pagination';

export function create(input) {
  return withWorkspace(input.workspaceId, (tx) =>
    tx.document.create({
      data: {
        workspaceId: input.workspaceId,
        title: input.title,
        parentId: input.parentId ?? null,
        icon: input.icon ?? null,
        createdBy: input.createdBy,
        yDoc: Buffer.alloc(0),
        yStateVec: Buffer.alloc(0),
      },
    }),
  );
}

export function list(workspaceId, parentId, cursor, limit = 20) {
  return withWorkspace(workspaceId, async (tx) => {
    const { take, cursorArgs } = paginate(cursor, limit);
    const rows = await tx.document.findMany({
      where: { workspaceId, parentId, deletedAt: null },
      orderBy: { updatedAt: 'desc' },
      take,
      ...cursorArgs,
    });
    return buildPage(rows, limit);
  });
}

export function getById(workspaceId, id) {
  return withWorkspace(workspaceId, async (tx) => {
    const doc = await tx.document.findUnique({ where: { id } });
    if (!doc || doc.deletedAt) throw notFound('document not found');
    return doc;
  });
}
