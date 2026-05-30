import {useEffect, useState} from 'react';

import type {PresentMember} from '@/global/types';
import {useSocket} from '@/store/SocketProvider';

// Subscribes to a workspace presence room and tracks who is currently online.
// Mirrors the intent of the web PresenceBar, which renders online avatars.
export function usePresence(workspaceId: string): PresentMember[] {
  const socket = useSocket();
  const [members, setMembers] = useState<PresentMember[]>([]);

  useEffect(() => {
    return socket.join(`presence:${workspaceId}`, e => {
      if (e.type === 'presence.sync') {
        setMembers((e.members as PresentMember[]) ?? []);
      } else if (e.type === 'presence.join') {
        const member = e.member as PresentMember;
        setMembers(prev =>
          prev.some(m => m.id === member.id) ? prev : [...prev, member],
        );
      } else if (e.type === 'presence.leave') {
        const id = e.userId as string;
        setMembers(prev => prev.filter(m => m.id !== id));
      }
    });
  }, [socket, workspaceId]);

  return members;
}
