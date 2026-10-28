import type { Apod } from '@/lib/nasa/types';
import { spaceArt } from './space-art';

const TITLES = [
  'Spiral Galaxy in Deep Field',
  'Aurora over a Frozen Lake',
  'The Pillars of a Stellar Nursery',
  'Saturn at Opposition',
  'A Comet Tail at Dawn',
  'Moonrise over the Desert',
  'Nebula in Hydrogen Light',
  'Milky Way above the Observatory',
];

/** Sample APOD entry. Video every 7th day so video handling is exercised. */
export function makeApod(date: string, overrides: Partial<Apod> = {}): Apod {
  const day = Number(date.slice(8, 10));
  const isVideo = day % 7 === 0;
  const title = TITLES[day % TITLES.length] ?? 'Sample Sky';
  const art = spaceArt(date);
  return {
    date,
    title: `${title} (sample)`,
    explanation:
      'This is sample data used for tests and offline demos. In the live app this text is the ' +
      'explanation written by a professional astronomer for each Astronomy Picture of the Day.',
    media_type: isVideo ? 'video' : 'image',
    // Not an embeddable host, so offline demos show the thumbnail fallback instead of a broken player.
    url: isVideo ? 'https://apod.nasa.gov/apod/sample-video.html' : art,
    hdurl: isVideo ? undefined : art,
    thumbnail_url: isVideo ? art : undefined,
    copyright: day % 3 === 0 ? 'Sample Photographer' : undefined,
    service_version: 'v1',
    ...overrides,
  };
}
