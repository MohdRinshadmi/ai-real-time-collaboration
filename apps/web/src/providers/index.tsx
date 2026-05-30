'use client';

import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { useState, type ReactNode } from 'react';

import { SocketProvider } from './socket-provider';

export function Providers({ children }: { children: ReactNode }) {
  const [queryClient] = useState(
    () =>
      new QueryClient({
        defaultOptions: {
          queries: {
            staleTime: 30_000,
            gcTime: 5 * 60_000,
            retry: (failureCount, error) => {
              if (error instanceof Response && [401, 403, 404].includes(error.status)) return false;
              return failureCount < 3;
            },
            refetchOnWindowFocus: false,
          },
          mutations: { retry: 0 },
        },
      }),
  );

  return (
    <QueryClientProvider client={queryClient}>
      <SocketProvider>{children}</SocketProvider>
    </QueryClientProvider>
  );
}
