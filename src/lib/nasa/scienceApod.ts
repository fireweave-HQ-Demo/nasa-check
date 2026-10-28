/**
 * APOD from science.nasa.gov (the site APOD moved to), via its public WordPress REST API.
 *
 * Why: api.nasa.gov's APOD service still scrapes the old apod.nasa.gov pages, which now redirect
 * to science.nasa.gov, so it returns a generic "NASA Science" placeholder for every date.
 * This adapter reads the real entries and converts them to the APOD response shape.
 *
 * The WordPress API is public but undocumented for APOD; parsing is defensive and returns
 * null rather than throwing on unexpected markup.
 */
import { addDays } from '@/utils/dates';
import { getJson, type GetJsonOptions } from './client';
import type { Apod } from './types';

export const SCIENCE_BASE = 'https://science.nasa.gov';
const ENDPOINT = '/wp-json/wp/v2/image-article';
const FIELDS = 'date,link,title,content,featured_image_url';

export type SciencePost = {
  date?: string;
  link?: string;
  title?: { rendered?: string };
  content?: { rendered?: string };
  featured_image_url?: string;
};

const EMBED_HOSTS = /(^|\.)(youtube\.com|youtube-nocookie\.com|vimeo\.com)$/i;

function decodeEntities(html: string): string {
  const doc = new DOMParser().parseFromString(`<!doctype html><body>${html}`, 'text/html');
  return doc.body.textContent ?? '';
}

const clean = (text: string) => text.replace(/\s+/g, ' ').trim();

function stripQuery(url: string): string {
  try {
    const u = new URL(url);
    u.search = '';
    return u.toString();
  } catch {
    return url;
  }
}

/** "APOD: 2026 October 28 – The Mutual Occultation…" → "The Mutual Occultation…" */
export function apodTitle(rendered: string): string {
  return clean(decodeEntities(rendered)).replace(
    /^APOD:\s*\d{4}\s+\p{L}+\s+\d{1,2}\s*[–—-]\s*/u,
    '',
  );
}

function explanationFrom(doc: Document): string {
  const p = doc.querySelector('.media-detail-hero__description');
  if (!p) return '';
  let text = '';
  let previousWasBreak = false;
  for (const node of Array.from(p.childNodes)) {
    const isBreak = node.nodeName === 'BR';
    if (isBreak && previousWasBreak) break; // a blank line separates trailing notes
    previousWasBreak = isBreak;
    text += isBreak ? ' ' : (node.textContent ?? '');
  }
  return clean(text.replace(/^\s*Explanation\s*:\s*/i, ''))
    .replace(/\s+([.,;:!?)\]])/g, '$1') // links in the source leave spaces before punctuation
    .replace(/([([])\s+/g, '$1');
}

function creditFrom(doc: Document): string | undefined {
  for (const row of Array.from(doc.querySelectorAll('.media-detail-hero__meta-row'))) {
    const label = clean(row.querySelector('th')?.textContent ?? '');
    if (/credit|copyright/i.test(label)) {
      const value = clean(row.querySelector('td')?.textContent ?? '').replace(
        /^(image\s+|video\s+)?(credit|copyright)(\s*&\s*copyright)?\s*:\s*/i,
        '',
      );
      return value || undefined;
    }
  }
  return undefined;
}

function mediaFrom(doc: Document, featured: string | undefined) {
  const iframe = Array.from(doc.querySelectorAll('iframe')).find((f) => {
    try {
      return EMBED_HOSTS.test(new URL(f.getAttribute('src') ?? '').hostname);
    } catch {
      return false;
    }
  });
  if (iframe) {
    return {
      media_type: 'video' as const,
      url: iframe.getAttribute('src') ?? undefined,
      thumbnail_url: featured,
    };
  }
  const video = doc.querySelector('video source[src], video[src]')?.getAttribute('src');
  if (video) return { media_type: 'video' as const, url: video, thumbnail_url: featured };
  if (featured) return { media_type: 'image' as const, url: featured, hdurl: featured };
  return { media_type: 'other' as const, url: undefined };
}

/** Convert a science.nasa.gov post into the APOD shape. Returns null if it isn't an APOD post. */
export function postToApod(post: SciencePost): Apod | null {
  const rendered = post.title?.rendered ?? '';
  const date = post.date?.slice(0, 10);
  if (!date || !/^\s*APOD:/i.test(decodeEntities(rendered))) return null;

  const doc = new DOMParser().parseFromString(post.content?.rendered ?? '', 'text/html');
  const featured = post.featured_image_url ? stripQuery(post.featured_image_url) : undefined;
  return {
    date,
    title: apodTitle(rendered),
    explanation: explanationFrom(doc),
    copyright: creditFrom(doc),
    ...mediaFrom(doc, featured),
    service_version: 'science.nasa.gov',
    source: 'science.nasa.gov',
    pageUrl: post.link,
  };
}

function rangeUrl(start: string, end: string): URL {
  const url = new URL(ENDPOINT, SCIENCE_BASE);
  url.searchParams.set('search', 'APOD');
  url.searchParams.set('after', `${addDays(start, -1)}T23:59:59`);
  url.searchParams.set('before', `${end}T23:59:59`);
  url.searchParams.set('per_page', '100');
  url.searchParams.set('orderby', 'date');
  url.searchParams.set('order', 'desc');
  url.searchParams.set('_fields', FIELDS);
  return url;
}

/** APOD entries between two dates (inclusive, max ~100 days), newest first, one per date. */
export async function getScienceApodRange(
  start: string,
  end: string,
  options?: GetJsonOptions,
): Promise<Apod[]> {
  const posts = await getJson<SciencePost[]>('apod.science', rangeUrl(start, end), options);
  const byDate = new Map<string, Apod>();
  for (const post of Array.isArray(posts) ? posts : []) {
    const apod = postToApod(post);
    if (apod && apod.date >= start && apod.date <= end && !byDate.has(apod.date)) {
      byDate.set(apod.date, apod);
    }
  }
  return [...byDate.values()].sort((a, b) => b.date.localeCompare(a.date));
}

export async function getScienceApod(date: string, options?: GetJsonOptions): Promise<Apod | null> {
  const [apod] = await getScienceApodRange(date, date, options);
  return apod ?? null;
}
