'use client';

import { createContext, useContext, useEffect, useMemo, type ReactNode } from 'react';

import { getSocketClient, type SocketClient } from '@/lib/socket/client';

const SocketContext = createContext<SocketClient | null>(null);

export function SocketProvider({ children }: { children: ReactNode }) {
  const client = useMemo(() => getSocketClient(), []);

  useEffect(() => {
    client.connect();
    return () => client.disconnect();
  }, [client]);

  return <SocketContext.Provider value={client}>{children}</SocketContext.Provider>;
}

export function useSocket(): SocketClient {
  const ctx = useContext(SocketContext);
  if (!ctx) throw new Error('useSocket must be used within SocketProvider');
  return ctx;
}
