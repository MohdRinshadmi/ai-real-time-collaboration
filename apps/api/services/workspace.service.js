import { prisma } from '../models';
import { conflict } from '../utils/app-error';

// Prisma enum values are accepted as string literals. We use them directly
// rather than importing the enum object, which @collab/db only re-exports as a
// type (no runtime value).

export async function create({ slug, name, ownerId }) {
  try {
    return await prisma.workspace.create({
      data: {
        slug,
        name,
        members: { create: { userId: ownerId, role: 'OWNER' } },
      },
    });
  } catch (err) {
    // P2002 = Prisma unique violation
    if (err?.code === 'P2002') throw conflict('slug already taken');
    throw err;
  }
}

export function listForUser(userId) {
  return prisma.workspace.findMany({
    where: { members: { some: { userId } }, deletedAt: null },
    orderBy: { createdAt: 'asc' },
  });
}

export function updatePlan(workspaceId, plan) {
  return prisma.workspace.update({ where: { id: workspaceId }, data: { plan } });
}
