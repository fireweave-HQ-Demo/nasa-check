import { useInfiniteQuery } from '@tanstack/react-query';
import { getApodRange, NasaApiError, type Apod } from '@/lib/nasa';
import { addDays, APOD_FIRST_DATE, todayInEastern } from '@/utils/dates';

export const GALLERY_PAGE_DAYS = 30;

export type GalleryPage = { items: Apod[]; start: string; end: string };

async function fetchPage(end: string, today: string, signal: AbortSignal): Promise<GalleryPage> {
  const startCandidate = addDays(end, -(GALLERY_PAGE_DAYS - 1));
  const start = startCandidate < APOD_FIRST_DATE ? APOD_FIRST_DATE : startCandidate;
  try {
    return { items: await getApodRange(start, end, { signal }), start, end };
  } catch (error) {
    // Today's entry may not be published yet; retry the first page ending yesterday.
    const unpublished =
      error instanceof NasaApiError && (error.kind === 'bad_request' || error.kind === 'not_found');
    if (unpublished && end === today) return fetchPage(addDays(today, -1), today, signal);
    throw error;
  }
}

/** APOD entries in 30-day pages, newest first, going back in time. */
export function useApodRange(today: string = todayInEastern()) {
  return useInfiniteQuery({
    queryKey: ['apod-range', today],
    initialPageParam: today,
    queryFn: ({ pageParam, signal }) => fetchPage(pageParam, today, signal),
    getNextPageParam: (last) =>
      last.start <= APOD_FIRST_DATE ? undefined : addDays(last.start, -1),
  });
}
