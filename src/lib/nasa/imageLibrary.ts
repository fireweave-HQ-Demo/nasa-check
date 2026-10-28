import { stripHtml } from '@/utils/format';
import { getJson, IMAGES_BASE, type GetJsonOptions } from './client';
import type { ImageItem, ImageSearchPage } from './types';

export const IMAGE_PAGE_SIZE = 24;

type RawItem = {
  href?: string;
  data?: Array<{
    nasa_id?: string;
    title?: string;
    description?: string;
    date_created?: string;
    center?: string;
    photographer?: string;
    keywords?: string[];
    media_type?: string;
  }>;
  links?: Array<{ href?: string; rel?: string; render?: string }>;
};

type RawSearch = {
  collection?: {
    items?: RawItem[];
    metadata?: { total_hits?: number };
    links?: Array<{ rel?: string; href?: string }>;
  };
};

/** NASA serves size variants as ~thumb, ~small, ~medium, ~large, ~orig. */
function largerVariant(thumb: string): string {
  return thumb.replace(/~(thumb|small)\.(jpe?g|png)$/i, '~medium.$2');
}

export function normaliseItem(raw: RawItem): ImageItem | null {
  const data = raw.data?.[0];
  const preview =
    raw.links?.find((l) => l.rel === 'preview' && l.render === 'image')?.href ??
    raw.links?.[0]?.href;
  if (!data?.nasa_id || !preview) return null;
  const thumbUrl = preview.replace(/^http:\/\//, 'https://');
  return {
    nasaId: data.nasa_id,
    title: data.title?.trim() || 'Untitled',
    description: stripHtml(data.description ?? ''),
    dateCreated: data.date_created ?? '',
    center: data.center,
    photographer: data.photographer,
    keywords: data.keywords ?? [],
    thumbUrl,
    largeUrl: largerVariant(thumbUrl),
  };
}

/** Search the NASA Image and Video Library (no API key required). */
export async function searchImages(
  query: string,
  page = 1,
  options?: GetJsonOptions,
): Promise<ImageSearchPage> {
  const url = new URL('/search', IMAGES_BASE);
  url.searchParams.set('q', query);
  url.searchParams.set('media_type', 'image');
  url.searchParams.set('page', String(page));
  url.searchParams.set('page_size', String(IMAGE_PAGE_SIZE));

  const raw = await getJson<RawSearch>('images.search', url, options);
  const items = (raw.collection?.items ?? [])
    .map(normaliseItem)
    .filter((item): item is ImageItem => item !== null);
  const totalHits = raw.collection?.metadata?.total_hits ?? items.length;
  const hasNext = raw.collection?.links?.some((l) => l.rel === 'next') ?? false;

  return { items, totalHits, page, nextPage: hasNext ? page + 1 : null };
}
