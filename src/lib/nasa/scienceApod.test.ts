import { http, HttpResponse } from 'msw';
import { describe, expect, it } from 'vitest';
import { makeSciencePost } from '@/test/fixtures/science';
import { APOD_URL, SCIENCE_URL } from '@/test/handlers';
import { server } from '@/test/server';
import { getApod, getApodRange, getLatestApod, isPlaceholderApod } from './apod';
import { apodTitle, getScienceApodRange, postToApod } from './scienceApod';

const PLACEHOLDER = {
  explanation: 'Discover the cosmos!',
  hdurl: 'https://science.nasa.gov/wp-content/themes/nasa-child/assets/images/nasa-logo@2x.png',
  media_type: 'image',
  service_version: 'v1',
  title: 'NASA Science',
  url: 'https://science.nasa.gov/wp-content/themes/nasa-child/assets/images/nasa-logo@2x.png',
};

function apiReturnsPlaceholder() {
  let apiCalls = 0;
  server.use(
    http.get(APOD_URL, ({ request }) => {
      apiCalls++;
      const p = new URL(request.url).searchParams;
      const date = p.get('date');
      if (date) return HttpResponse.json({ ...PLACEHOLDER, date });
      return HttpResponse.json([{ ...PLACEHOLDER, date: p.get('start_date') }]);
    }),
  );
  return () => apiCalls;
}

describe('postToApod', () => {
  it('parses title, explanation, credit and image', () => {
    const apod = postToApod(
      makeSciencePost('1998-07-06', {
        title: 'Sizzling Io',
        credit: ['Credit:', 'Credit: Galileo Project, JPL, NASA'],
      }),
    );
    expect(apod).toEqual({
      date: '1998-07-06',
      title: 'Sizzling Io',
      explanation: 'What’s cooking on Io? A sample explanation.',
      copyright: 'Galileo Project, JPL, NASA',
      media_type: 'image',
      url: 'https://assets.science.nasa.gov/apod/1998-07-06.jpg',
      hdurl: 'https://assets.science.nasa.gov/apod/1998-07-06.jpg',
      service_version: 'science.nasa.gov',
      source: 'science.nasa.gov',
      pageUrl: 'https://science.nasa.gov/image-article/apod-1998-07-06/',
    });
  });

  it('detects YouTube embeds and mp4 videos', () => {
    const yt = postToApod(
      makeSciencePost('2026-10-18', {
        media: '<iframe src="https://www.youtube.com/embed/DzrCEm1ZBRY?feature=oembed"></iframe>',
      }),
    );
    expect(yt).toMatchObject({
      media_type: 'video',
      url: 'https://www.youtube.com/embed/DzrCEm1ZBRY?feature=oembed',
      thumbnail_url: 'https://assets.science.nasa.gov/apod/2026-10-18.jpg',
    });
    const mp4 = postToApod(
      makeSciencePost('2026-10-28', {
        media: '<video><source src="https://assets.science.nasa.gov/occultation.mp4"></video>',
      }),
    );
    expect(mp4).toMatchObject({
      media_type: 'video',
      url: 'https://assets.science.nasa.gov/occultation.mp4',
    });
  });

  it('ignores posts that are not APOD entries', () => {
    expect(postToApod({ date: '2024-01-01', title: { rendered: 'Some news' } })).toBeNull();
    expect(postToApod({ title: { rendered: 'APOD: 2024 January 1 – X' } })).toBeNull();
  });

  it('strips the date prefix with any dash style', () => {
    expect(apodTitle('APOD: 2024 January 7 &#8211; The Cats Eye Nebula')).toBe(
      'The Cats Eye Nebula',
    );
    expect(apodTitle('APOD: 2026 October 24 – Rosetta&#8217;s Selfie')).toBe('Rosetta’s Selfie');
  });
});

describe('getScienceApodRange', () => {
  it('queries by date window and dedupes, newest first', async () => {
    let seen: URL | undefined;
    server.use(
      http.get(SCIENCE_URL, ({ request }) => {
        seen = new URL(request.url);
        return HttpResponse.json([
          makeSciencePost('2024-01-02'),
          makeSciencePost('2024-01-02', { title: 'Duplicate' }),
          makeSciencePost('2024-01-01'),
          { date: '2024-01-01T09:00:00', title: { rendered: 'Not an APOD' } },
        ]);
      }),
    );
    const items = await getScienceApodRange('2024-01-01', '2024-01-02');
    expect(seen?.searchParams.get('after')).toBe('2023-12-31T23:59:59');
    expect(seen?.searchParams.get('before')).toBe('2024-01-02T23:59:59');
    expect(seen?.searchParams.get('search')).toBe('APOD');
    expect(items.map((i) => [i.date, i.title])).toEqual([
      ['2024-01-02', 'Sample Nebula – 2024-01-02'],
      ['2024-01-01', 'Sample Nebula – 2024-01-01'],
    ]);
  });
});

describe('APOD fallback', () => {
  it('detects the placeholder', () => {
    expect(isPlaceholderApod(PLACEHOLDER)).toBe(true);
    expect(isPlaceholderApod({ title: 'Sizzling Io', url: 'x.jpg' })).toBe(false);
  });

  it('uses science.nasa.gov when api.nasa.gov returns the placeholder, then skips the API', async () => {
    const apiCalls = apiReturnsPlaceholder();
    const first = await getApod('1998-07-06');
    expect(first).toMatchObject({ date: '1998-07-06', source: 'science.nasa.gov' });
    expect(first.title).not.toBe('NASA Science');
    await getApod('1998-07-07');
    expect(apiCalls()).toBe(1);
    expect(
      Number(localStorage.getItem('nasa-explorer.apod-api-placeholder-until')),
    ).toBeGreaterThan(Date.now());
  });

  it('tidies spaces left before punctuation by inline links', () => {
    const apod = postToApod(
      makeSciencePost('1998-07-06', {
        explanation:
          'What is on <a href="#">Io</a> ? Lava hotter than <a href="#">Earth</a> . ( see <a>this</a> )',
      }),
    );
    expect(apod?.explanation).toBe('What is on Io? Lava hotter than Earth. (see this)');
  });

  it('falls back for ranges too', async () => {
    apiReturnsPlaceholder();
    const items = await getApodRange('2024-01-01', '2024-01-03');
    expect(items.map((i) => i.date)).toEqual(['2024-01-03', '2024-01-02', '2024-01-01']);
    expect(items.every((i) => i.source === 'science.nasa.gov')).toBe(true);
  });

  it('falls back when api.nasa.gov is rate limited', async () => {
    server.use(
      http.get(APOD_URL, () =>
        HttpResponse.json({ error: { code: 'OVER_RATE_LIMIT' } }, { status: 429 }),
      ),
    );
    expect(await getApod('2024-01-01')).toMatchObject({ source: 'science.nasa.gov' });
  });

  it('reports the original error when both sources fail', async () => {
    server.use(
      http.get(APOD_URL, () => new HttpResponse(null, { status: 503 })),
      http.get(SCIENCE_URL, () => HttpResponse.error()),
    );
    await expect(getApod('2024-01-01')).rejects.toMatchObject({ kind: 'server', endpoint: 'apod' });
  });

  it('latest falls back to yesterday when today has no science post yet', async () => {
    apiReturnsPlaceholder();
    server.use(
      http.get(SCIENCE_URL, ({ request }) => {
        const before = new URL(request.url).searchParams.get('before')!.slice(0, 10);
        return HttpResponse.json(before === '2026-10-28' ? [] : [makeSciencePost(before)]);
      }),
    );
    expect((await getLatestApod(undefined, '2026-10-28')).date).toBe('2026-10-27');
  });

  it('keeps using api.nasa.gov when it returns real data', async () => {
    expect(await getApod('2024-01-01')).toMatchObject({ source: 'api.nasa.gov' });
  });
});
