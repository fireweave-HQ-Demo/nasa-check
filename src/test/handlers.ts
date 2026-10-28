import { http, HttpResponse, delay } from 'msw';
import { addDays, todayInEastern } from '@/utils/dates';
import { makeApod } from './fixtures/apod';
import { makeImageSearch } from './fixtures/images';
import { makeSciencePost } from './fixtures/science';

const APOD_URL = 'https://api.nasa.gov/planetary/apod';
const SEARCH_URL = 'https://images-api.nasa.gov/search';
const SCIENCE_URL = 'https://science.nasa.gov/wp-json/wp/v2/image-article';

/** Default handlers: realistic success responses. Used by tests and `npm run dev:mock`. */
export const handlers = [
  http.get(APOD_URL, async ({ request }) => {
    const url = new URL(request.url);
    const start = url.searchParams.get('start_date');
    const end = url.searchParams.get('end_date');
    const date = url.searchParams.get('date') ?? todayInEastern();

    if (start) {
      const last = end ?? todayInEastern();
      const items = [];
      for (let d = start; d <= last; d = addDays(d, 1)) items.push(makeApod(d));
      return HttpResponse.json(items);
    }
    return HttpResponse.json(makeApod(date));
  }),

  http.get(SEARCH_URL, ({ request }) => {
    const url = new URL(request.url);
    const q = url.searchParams.get('q') ?? '';
    const page = Number(url.searchParams.get('page') ?? '1');
    const size = Number(url.searchParams.get('page_size') ?? '24');
    if (q.toLowerCase() === 'nothing') return HttpResponse.json(makeImageSearch(q, page, size, 0));
    return HttpResponse.json(makeImageSearch(q, page, size));
  }),

  // science.nasa.gov fallback: one post per day between `after` and `before`, newest first.
  http.get(SCIENCE_URL, ({ request }) => {
    const url = new URL(request.url);
    const after = addDays((url.searchParams.get('after') ?? '').slice(0, 10), 1);
    const before = (url.searchParams.get('before') ?? '').slice(0, 10);
    const posts = [];
    for (let d = before; d >= after; d = addDays(d, -1)) posts.push(makeSciencePost(d));
    return HttpResponse.json(posts);
  }),
];

/** Adds latency in the browser mock so loading states are visible. Falls through to `handlers`. */
export const withLatency = http.all('*', async () => {
  await delay(350);
});

export { APOD_URL, SEARCH_URL, SCIENCE_URL };
