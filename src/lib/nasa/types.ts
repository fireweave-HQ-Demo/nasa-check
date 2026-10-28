export type ApodMediaType = 'image' | 'video' | 'other';

/** Raw APOD response (https://github.com/nasa/apod-api). */
export type Apod = {
  date: string;
  title: string;
  explanation: string;
  url?: string;
  hdurl?: string;
  media_type: ApodMediaType;
  thumbnail_url?: string;
  copyright?: string;
  service_version?: string;
  /** Not part of the NASA API: where this entry came from, and its page on that site. */
  source?: 'api.nasa.gov' | 'science.nasa.gov';
  pageUrl?: string;
};

/** Normalised NASA Image and Video Library item. */
export type ImageItem = {
  nasaId: string;
  title: string;
  description: string;
  dateCreated: string;
  center?: string;
  photographer?: string;
  keywords: string[];
  thumbUrl: string;
  largeUrl: string;
};

export type ImageSearchPage = {
  items: ImageItem[];
  totalHits: number;
  page: number;
  nextPage: number | null;
};

export type NasaErrorKind =
  | 'rate_limited'
  | 'invalid_key'
  | 'not_found'
  | 'bad_request'
  | 'server'
  | 'network'
  | 'timeout'
  | 'aborted';
