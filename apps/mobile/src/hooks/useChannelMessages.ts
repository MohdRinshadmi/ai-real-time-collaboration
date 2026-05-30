import {useEffect} from 'react';
import {useMutation, useQuery, useQueryClient} from '@tanstack/react-query';

import {channelsApi, type Message} from '@/api';
import {useSocket} from '@/store/SocketProvider';

// Port of apps/web/src/features/chat/hooks/useChannelMessages.ts.
// Same optimistic-send + WebSocket live-append behaviour.

export function useChannelMessages(channelId: string) {
  const qc = useQueryClient();
  const socket = useSocket();

  const {data = [], isLoading} = useQuery<Message[]>({
    queryKey: ['messages', channelId],
    queryFn: () => channelsApi.listMessages(channelId),
  });

  useEffect(() => {
    return socket.join(`channel:${channelId}`, e => {
      if (e.type === 'message.sent') {
        qc.setQueryData<Message[]>(['messages', channelId], (prev = []) => {
          const incoming = e.message as Message;
          // Replace any optimistic placeholder rather than duplicating.
          const withoutOptimistic = prev.filter(
            m => !m.id.startsWith('optimistic-'),
          );
          if (withoutOptimistic.some(m => m.id === incoming.id)) {
            return withoutOptimistic;
          }
          return [...withoutOptimistic, incoming];
        });
      }
    });
  }, [channelId, qc, socket]);

  const mutation = useMutation({
    mutationFn: (text: string) => channelsApi.postMessage(channelId, text),
    onMutate: async (text: string) => {
      await qc.cancelQueries({queryKey: ['messages', channelId]});
      const prev = qc.getQueryData<Message[]>(['messages', channelId]);
      qc.setQueryData<Message[]>(['messages', channelId], (curr = []) => [
        ...curr,
        {
          id: `optimistic-${Date.now()}`,
          authorName: 'You',
          text,
          createdAt: new Date().toISOString(),
        },
      ]);
      return {prev};
    },
    onError: (_e, _v, ctx) => {
      if (ctx?.prev) qc.setQueryData(['messages', channelId], ctx.prev);
    },
  });

  return {messages: data, isLoading, sendMessage: mutation.mutate};
}
