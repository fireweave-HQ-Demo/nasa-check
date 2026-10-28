import { http, HttpResponse } from 'msw';
import { describe, expect, it, vi } from 'vitest';
import { server } from '@/test/server';
import { APOD_URL, SCIENCE_URL, SEARCH_URL } from '@/test/handlers';
import { getApod, getApodRange, getLatestApod, apodPreviewUrl } from './apod';
import { getJson, NasaApiError, onRequestTiming } from './client';
import { normaliseItem, searchImages } from './imageLibrary';

describe('getApod', () => {
  it('requests the date with the api key and thumbnails', async () => {
    let seen: URL | undefined;
    server.use(
      http.get(APOD_URL, ({ request }) => {
        seen = new URL(request.url);
        return HttpResponse.json({
          date: '2024-01-01',
          title: 'T',
          explanation: 'E',
          media_type: 'image',
          url: 'u',
        });
      }),
    );
    const apod = await getApod('2024-01-01');
    expect(apod.title).toBe('T');
    expect(seen?.searchParams.get('date')).toBe('2024-01-01');
    expect(seen?.searchParams.get('thumbs')).toBe('true');
    expect(seen?.searchParams.get('api_key')).toBeTruthy();
  });

  it('maps 429 to a rate_limited error', async () => {
    server.use(http.get(SCIENCE_URL, () => HttpResponse.error())); // isolate api.nasa.gov behaviour
    server.use(
      http.get(APOD_URL, () =>
        HttpResponse.json(
          { error: { code: 'OVER_RATE_LIMIT', message: 'Slow down' } },
          { status: 429 },
        ),
      ),
    );
    await expect(getApod('2024-01-01')).rejects.toMatchObject({
      kind: 'rate_limited',
      status: 429,
      message: 'Slow down',
    });
  });

  it('maps 403 to invalid_key', async () => {
    server.use(http.get(SCIENCE_URL, () => HttpResponse.error())); // isolate api.nasa.gov behaviour
    server.use(
      http.get(APOD_URL, () =>
        HttpResponse.json({ error: { code: 'API_KEY_INVALID' } }, { status: 403 }),
      ),
    );
    await expect(getApod('2024-01-01')).rejects.toMatchObject({ kind: 'invalid_key' });
  });

  it('maps network failures to network errors', async () => {
    server.use(http.get(SCIENCE_URL, () => HttpResponse.error())); // isolate api.nasa.gov behaviour
    server.use(http.get(APOD_URL, () => HttpResponse.error()));
    const error = await getApod('2024-01-01').catch((e: unknown) => e);
    expect(error).toBeInstanceOf(NasaApiError);
    expect((error as NasaApiError).kind).toBe('network');
    expect((error as NasaApiError).retryable).toBe(true);
  });
});

describe('getLatestApod', () => {
  it('falls back to yesterday when today is not published yet', async () => {
    server.use(http.get(SCIENCE_URL, () => HttpResponse.error())); // isolate api.nasa.gov behaviour
    server.use(
      http.get(APOD_URL, ({ request }) => {
        const date = new URL(request.url).searchParams.get('date');
        if (date === '2026-10-28')
          return HttpResponse.json(
            { code: 404, msg: 'No data available for date' },
            { status: 404 },
          );
        return HttpResponse.json({
          date,
          title: 'Yesterday',
          explanation: '',
          media_type: 'image',
          url: 'u',
        });
      }),
    );
    const apod = await getLatestApod(undefined, '2026-10-28');
    expect(apod.date).toBe('2026-10-27');
  });

  it('does not swallow other errors', async () => {
    server.use(http.get(SCIENCE_URL, () => HttpResponse.error())); // isolate api.nasa.gov behaviour
    server.use(http.get(APOD_URL, () => new HttpResponse(null, { status: 500 })));
    await expect(getLatestApod(undefined, '2026-10-28')).rejects.toMatchObject({ kind: 'server' });
  });
});

describe('getApodRange', () => {
  it('returns entries newest first', async () => {
    const items = await getApodRange('2024-01-01', '2024-01-05');
    expect(items.map((i) => i.date)).toEqual([
      '2024-01-05',
      '2024-01-04',
      '2024-01-03',
      '2024-01-02',
      '2024-01-01',
    ]);
  });
});

describe('apodPreviewUrl', () => {
  it('uses the thumbnail for videos', () => {
    expect(
      apodPreviewUrl({
        date: 'd',
        title: 't',
        explanation: '',
        media_type: 'video',
        url: 'v',
        thumbnail_url: 'th',
      }),
    ).toBe('th');
    expect(
      apodPreviewUrl({ date: 'd', title: 't', explanation: '', media_type: 'image', url: 'img' }),
    ).toBe('img');
  });
});

describe('searchImages', () => {
  it('normalises items and pagination', async () => {
    const page1 = await searchImages('nebula', 1);
    expect(page1.items).toHaveLength(24);
    expect(page1.totalHits).toBe(60);
    expect(page1.nextPage).toBe(2);
    const page3 = await searchImages('nebula', 3);
    expect(page3.items).toHaveLength(12);
    expect(page3.nextPage).toBeNull();
  });

  it('sends media_type=image', async () => {
    let seen: URL | undefined;
    server.use(
      http.get(SEARCH_URL, ({ request }) => {
        seen = new URL(request.url);
        return HttpResponse.json({ collection: { items: [], metadata: { total_hits: 0 } } });
      }),
    );
    const result = await searchImages('mars');
    expect(seen?.searchParams.get('media_type')).toBe('image');
    expect(result).toEqual({ items: [], totalHits: 0, page: 1, nextPage: null });
  });

  it('builds larger image URLs, upgrades http and strips html', () => {
    const item = normaliseItem({
      data: [{ nasa_id: 'X1', title: ' Hello ', description: '<p>A &amp; B</p>' }],
      links: [
        {
          href: 'http://images-assets.nasa.gov/image/X1/X1~thumb.jpg',
          rel: 'preview',
          render: 'image',
        },
      ],
    });
    expect(item).toMatchObject({
      nasaId: 'X1',
      title: 'Hello',
      description: 'A & B',
      thumbUrl: 'https://images-assets.nasa.gov/image/X1/X1~thumb.jpg',
      largeUrl: 'https://images-assets.nasa.gov/image/X1/X1~medium.jpg',
    });
  });

  it('skips items without an id or preview', () => {
    expect(normaliseItem({ data: [{ title: 'no id' }] })).toBeNull();
  });
});

describe('timing hook', () => {
  it('reports endpoint, status and duration for success and failure', async () => {
    server.use(http.get(SCIENCE_URL, () => HttpResponse.error())); // isolate api.nasa.gov behaviour
    const timings: unknown[] = [];
    const off = onRequestTiming((t) => timings.push(t));
    await getApod('2024-01-01');
    server.use(http.get(APOD_URL, () => new HttpResponse(null, { status: 500 })));
    await getApod('2024-01-02').catch(() => undefined);
    off();
    expect(timings).toEqual(
      expect.arrayContaining([
        expect.objectContaining({ endpoint: 'apod', status: 200, ok: true }),
        expect.objectContaining({ endpoint: 'apod', status: 500, ok: false, errorKind: 'server' }),
        expect.objectContaining({
          endpoint: 'apod.science',
          status: 0,
          ok: false,
          errorKind: 'network',
        }),
      ]),
    );
  });

  it('times out slow requests', async () => {
    vi.useFakeTimers({ toFake: ['setTimeout', 'clearTimeout'] });
    server.use(http.get(APOD_URL, () => new Promise<Response>(() => undefined)));
    const pending = getJson('apod', new URL(APOD_URL), { timeoutMs: 50 }).catch((e: unknown) => e);
    await vi.advanceTimersByTimeAsync(60);
    vi.useRealTimers();
    expect(await pending).toMatchObject({ kind: 'timeout' });
  });
});
