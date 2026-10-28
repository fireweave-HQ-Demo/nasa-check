import { QueryClient } from '@tanstack/react-query';
import { NasaApiError } from '@/lib/nasa';

const HOUR = 60 * 60 * 1000;

export function createQueryClient() {
  return new QueryClient({
    defaultOptions: {
      queries: {
        staleTime: HOUR,
        gcTime: 2 * HOUR,
        refetchOnWindowFocus: false,
        retry: (failureCount, error) =>
          failureCount < 2 && (!(error instanceof NasaApiError) || error.retryable),
        retryDelay: (attempt) => Math.min(1000 * 2 ** attempt, 8000),
      },
    },
  });
}
