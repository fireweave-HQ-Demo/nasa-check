import { useInfiniteQuery } from '@tanstack/react-query';
import { searchImages } from '@/lib/nasa';

export function useImageSearch(query: string) {
  const q = query.trim();
  return useInfiniteQuery({
    queryKey: ['image-search', q.toLowerCase()],
    enabled: q.length > 0,
    initialPageParam: 1,
    queryFn: ({ pageParam, signal }) => searchImages(q, pageParam, { signal }),
    getNextPageParam: (last) => last.nextPage ?? undefined,
  });
}
