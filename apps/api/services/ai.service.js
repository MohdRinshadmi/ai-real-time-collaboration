import { prisma } from '../models';

// Thin façade in front of the dedicated AI Gateway service. We keep auth +
// budget enforcement at this edge, then proxy. For now we just list the user's
// conversations for the AI sidebar — a simple ownership filter.
export function listConversations(userId) {
  return prisma.aIConversation.findMany({
    where: { userId },
    orderBy: { updatedAt: 'desc' },
    take: 50,
  });
}
