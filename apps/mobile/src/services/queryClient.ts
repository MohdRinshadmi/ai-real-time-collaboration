import {QueryClient} from '@tanstack/react-query';

// Same query defaults as the web app (apps/web/src/providers/index.tsx).
export function createQueryClient(): QueryClient {
  return new QueryClient({
    defaultOptions: {
      queries: {
        staleTime: 30_000,
        gcTime: 5 * 60_000,
        retry: (failureCount, error) => {
          if (
            error instanceof Response &&
            [401, 403, 404].includes(error.status)
          ) {
            return false;
          }
          return failureCount < 3;
        },
        refetchOnWindowFocus: false,
      },
      mutations: {retry: 0},
    },
  });
}
