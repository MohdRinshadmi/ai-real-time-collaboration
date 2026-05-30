import React, {
  createContext,
  useContext,
  useEffect,
  useMemo,
  type ReactNode,
} from 'react';
import {AppState, type AppStateStatus} from 'react-native';

import {getSocketClient, type SocketClient} from '@/api';

const SocketContext = createContext<SocketClient | null>(null);

export function SocketProvider({children}: {children: ReactNode}) {
  const client = useMemo(() => getSocketClient(), []);

  // The OS tears down sockets in the background; reconnect on foreground and
  // drop the connection when backgrounded to save battery/data.
  useEffect(() => {
    const onChange = (state: AppStateStatus) => {
      if (state === 'active') client.connect();
      else client.disconnect();
    };
    const sub = AppState.addEventListener('change', onChange);
    return () => sub.remove();
  }, [client]);

  return (
    <SocketContext.Provider value={client}>{children}</SocketContext.Provider>
  );
}

export function useSocket(): SocketClient {
  const ctx = useContext(SocketContext);
  if (!ctx) throw new Error('useSocket must be used within SocketProvider');
  return ctx;
}
