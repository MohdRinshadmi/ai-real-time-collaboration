import { prisma } from '../models';
import { paginate, buildPage } from '../helper/pagination';

const authorSelect = { author: { select: { id: true, name: true, avatarUrl: true } } };

// Cursor pagination by id, not offset — offset breaks under concurrent inserts
// (rows shift between pages). Rows come back newest-first then get reversed so
// the page reads oldest→newest for the UI.
export async function list(channelId, cursor, limit = 50) {
  const { take, cursorArgs } = paginate(cursor, limit);
  const rows = await prisma.message.findMany({
    where: { channelId, deletedAt: null },
    orderBy: { createdAt: 'desc' },
    take,
    ...cursorArgs,
    include: authorSelect,
  });
  return buildPage(rows, limit, { reverse: true });
}

export function send({ channelId, authorId, content, threadId }) {
  return prisma.$transaction(async (tx) => {
    const msg = await tx.message.create({
      data: {
        channelId,
        authorId,
        content,
        threadId: threadId ?? null,
      },
      include: authorSelect,
    });
    // Outbox — Debezium streams this to Kafka. Critical that this happens in
    // the same transaction as the write.
    await tx.outbox.create({
      data: {
        aggregateId: msg.id,
        eventType: 'message.sent',
        payload: { messageId: msg.id, channelId, authorId },
      },
    });
    return msg;
  });
}
