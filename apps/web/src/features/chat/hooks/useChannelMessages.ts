'use client';

import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useEffect } from 'react';

import { api } from '@/lib/api/client';
import { useSocket } from '@/providers/socket-provider';

type Message = { id: string; authorName: string; text: string; createdAt: string };

export function useChannelMessages(channelId: string) {
  const qc = useQueryClient();
  const socket = useSocket();

  const { data = [] } = useQuery<Message[]>({
    queryKey: ['messages', channelId],
    queryFn: () => api(`/channels/${channelId}/messages`),
  });

  // Subscribe to live messages via WebSocket and prepend optimistically.
  useEffect(() => {
    return socket.join(`channel:${channelId}`, (e) => {
      if (e.type === 'message.sent') {
        qc.setQueryData<Message[]>(['messages', channelId], (prev) => [
          ...(prev ?? []),
          e.message as Message,
        ]);
      }
    });
  }, [channelId, qc, socket]);

  const mutation = useMutation({
    mutationFn: (text: string) =>
      api(`/channels/${channelId}/messages`, {
        method: 'POST',
        body: JSON.stringify({ text }),
      }),
    onMutate: async (text) => {
      await qc.cancelQueries({ queryKey: ['messages', channelId] });
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
      return { prev };
    },
    onError: (_e, _v, ctx) => {
      if (ctx?.prev) qc.setQueryData(['messages', channelId], ctx.prev);
    },
  });

  return { messages: data, sendMessage: mutation.mutate };
}
