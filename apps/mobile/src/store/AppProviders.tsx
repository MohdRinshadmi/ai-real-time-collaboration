import React, {useState, type ReactNode} from 'react';
import {QueryClientProvider} from '@tanstack/react-query';
import {SafeAreaProvider} from 'react-native-safe-area-context';

import {createQueryClient} from '@/services/queryClient';

import {AuthProvider} from './AuthProvider';
import {SocketProvider} from './SocketProvider';

export function AppProviders({children}: {children: ReactNode}) {
  const [queryClient] = useState(createQueryClient);

  return (
    <SafeAreaProvider>
      <QueryClientProvider client={queryClient}>
        <AuthProvider>
          <SocketProvider>{children}</SocketProvider>
        </AuthProvider>
      </QueryClientProvider>
    </SafeAreaProvider>
  );
}
