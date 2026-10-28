/**
 * The catalog of custom events. Event names live only here.
 * Keep properties low-cardinality and free of personal data (no raw search text).
 */
export type EventMap = {
  app_loaded: { device_id_new: boolean; storage_persisted: boolean };
  apod_viewed: { date: string; media_type: string; source: 'today' | 'gallery' };
  apod_random_clicked: Record<string, never>;
  apod_date_changed: { via: 'picker' | 'prev' | 'next' | 'latest' };
  gallery_page_loaded: { range_days: number; count: number; page: number };
  lightbox_opened: { source: 'today' | 'gallery' | 'explore' };
  search_performed: { query_len: number; results: number; suggested: boolean };
  search_more_loaded: { page: number };
  api_call: { endpoint: string; status: number; duration_ms: number };
  api_error: { endpoint: string; status: number; kind: string };
};

export type EventName = keyof EventMap;

export const EVENT_NAMES: readonly EventName[] = [
  'app_loaded',
  'apod_viewed',
  'apod_random_clicked',
  'apod_date_changed',
  'gallery_page_loaded',
  'lightbox_opened',
  'search_performed',
  'search_more_loaded',
  'api_call',
  'api_error',
];
