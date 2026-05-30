'use client';

import { useEffect, useState } from 'react';
import type { WebsocketProvider } from 'y-websocket';

import { Avatar } from '@collab/ui';

type AwarenessUser = { id: string; name: string; color: string };

export function PresenceAvatars({ provider }: { provider: WebsocketProvider }) {
  const [users, setUsers] = useState<AwarenessUser[]>([]);

  useEffect(() => {
    const update = () => {
      const list: AwarenessUser[] = [];
      provider.awareness.getStates().forEach((state) => {
        if (state.user) list.push(state.user as AwarenessUser);
      });
      // dedupe by id; awareness may briefly have stale entries
      const seen = new Set<string>();
      setUsers(list.filter((u) => (seen.has(u.id) ? false : (seen.add(u.id), true))));
    };
    update();
    provider.awareness.on('change', update);
    return () => provider.awareness.off('change', update);
  }, [provider]);

  return (
    <div className="flex -space-x-2">
      {users.slice(0, 5).map((u) => (
        <Avatar
          key={u.id}
          name={u.name}
          size="sm"
          className="ring-2 ring-background"
        />
      ))}
      {users.length > 5 && (
        <span className="ml-2 text-xs text-muted-foreground">+{users.length - 5}</span>
      )}
    </div>
  );
}
