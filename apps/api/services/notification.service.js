import { prisma } from '../models';

export function list(userId, unreadOnly, limit = 50) {
  return prisma.notification.findMany({
    where: { userId, ...(unreadOnly ? { readAt: null } : {}) },
    orderBy: { createdAt: 'desc' },
    take: limit,
  });
}

export function markRead(userId, ids) {
  return prisma.notification.updateMany({
    where: { userId, id: { in: ids } },
    data: { readAt: new Date() },
  });
}
