import { useQuery } from '@tanstack/react-query';
import { getApod, getLatestApod } from '@/lib/nasa';

/** APOD for a date, or the latest entry when no date is given. */
export function useApod(date?: string) {
  return useQuery({
    queryKey: ['apod', date ?? 'latest'],
    queryFn: ({ signal }) => (date ? getApod(date, { signal }) : getLatestApod({ signal })),
  });
}
