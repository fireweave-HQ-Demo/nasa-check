import { config } from '@/lib/config';
import { addDays, todayInEastern } from '@/utils/dates';
import { APOD_BASE, getJson, NasaApiError, type GetJsonOptions } from './client';
import { getScienceApod, getScienceApodRange } from './scienceApod';
import type { Apod } from './types';

function apodUrl(params: Record<string, string>, apiKey = config.nasaApiKey): URL {
  const url = new URL('/planetary/apod', APOD_BASE);
  url.searchParams.set('api_key', apiKey);
  url.searchParams.set('thumbs', 'true');
  for (const [k, v] of Object.entries(params)) url.searchParams.set(k, v);
  return url;
}

/**
 * api.nasa.gov currently answers every date with a generic "NASA Science" page because APOD
 * moved to science.nasa.gov. Detect that so we can fall back.
 */
export function isPlaceholderApod(apod: Pick<Apod, 'title' | 'url'>): boolean {
  return apod.title === 'NASA Science' || /nasa-logo/i.test(apod.url ?? '');
}

// Once api.nasa.gov has returned the placeholder, skip it for a while (it takes ~6s to answer).
// Remembered across page loads so a refresh doesn't pay that cost again; re-checked after the TTL.
const PLACEHOLDER_KEY = 'nasa-explorer.apod-api-placeholder-until';
const PLACEHOLDER_TTL_MS = 6 * 60 * 60 * 1000;
let placeholderUntil = 0;

function readStoredFlag(): number {
  try {
    return Number(window.localStorage.getItem(PLACEHOLDER_KEY)) || 0;
  } catch {
    return 0;
  }
}

function apiServesPlaceholder(): boolean {
  placeholderUntil = Math.max(placeholderUntil, readStoredFlag());
  return Date.now() < placeholderUntil;
}

function markApiServesPlaceholder() {
  placeholderUntil = Date.now() + PLACEHOLDER_TTL_MS;
  try {
    window.localStorage.setItem(PLACEHOLDER_KEY, String(placeholderUntil));
  } catch {
    // storage unavailable: remember for this page only
  }
}

/** Test helper. */
export function __resetApodSourceForTests() {
  placeholderUntil = 0;
  try {
    window.localStorage.removeItem(PLACEHOLDER_KEY);
  } catch {
    // ignore
  }
}

function shouldFallBack(error: unknown): boolean {
  return !(error instanceof NasaApiError && error.kind === 'aborted');
}

const tag = (apod: Apod): Apod => ({ ...apod, source: apod.source ?? 'api.nasa.gov' });

/** APOD for a specific date (YYYY-MM-DD). */
export async function getApod(date: string, options?: GetJsonOptions): Promise<Apod> {
  const fromScience = async (original?: unknown) => {
    const apod = await getScienceApod(date, options).catch((e: unknown) => {
      throw original ?? e;
    });
    if (apod) return apod;
    throw (
      original ?? new NasaApiError('not_found', 'apod.science', `No APOD found for ${date}.`, 404)
    );
  };

  if (apiServesPlaceholder()) return fromScience();
  try {
    const apod = await getJson<Apod>('apod', apodUrl({ date }), options);
    if (!isPlaceholderApod(apod)) return tag(apod);
    markApiServesPlaceholder();
  } catch (error) {
    if (!shouldFallBack(error)) throw error;
    return fromScience(error);
  }
  return fromScience();
}

/**
 * Latest APOD. Today's entry may not be published yet (it rolls over at midnight
 * US Eastern), in which case we fall back to yesterday.
 */
export async function getLatestApod(
  options?: GetJsonOptions,
  today: string = todayInEastern(),
): Promise<Apod> {
  try {
    return await getApod(today, options);
  } catch (error) {
    if (
      error instanceof NasaApiError &&
      (error.kind === 'not_found' || error.kind === 'bad_request')
    ) {
      return getApod(addDays(today, -1), options);
    }
    throw error;
  }
}

/** APOD entries between two dates (inclusive), newest first. */
export async function getApodRange(
  startDate: string,
  endDate: string,
  options?: GetJsonOptions,
): Promise<Apod[]> {
  const fromScience = async (original?: unknown) => {
    const items = await getScienceApodRange(startDate, endDate, options).catch((e: unknown) => {
      throw original ?? e;
    });
    if (items.length > 0 || !original) return items;
    throw original;
  };

  if (apiServesPlaceholder()) return fromScience();
  try {
    const items = await getJson<Apod[]>(
      'apod.range',
      apodUrl({ start_date: startDate, end_date: endDate }),
      options,
    );
    if (!items.some(isPlaceholderApod)) {
      return [...items].map(tag).sort((a, b) => b.date.localeCompare(a.date));
    }
    markApiServesPlaceholder();
  } catch (error) {
    if (!shouldFallBack(error)) throw error;
    return fromScience(error);
  }
  return fromScience();
}

/** Best image to show for an entry (videos use their thumbnail). */
export function apodPreviewUrl(apod: Apod): string | undefined {
  return apod.media_type === 'image' ? apod.url : apod.thumbnail_url;
}

/** Link to the entry's page on NASA's site. */
export function apodPageUrl(apod: Apod): string {
  if (apod.pageUrl) return apod.pageUrl;
  return `https://apod.nasa.gov/apod/ap${apod.date.slice(2).replaceAll('-', '')}.html`;
}
