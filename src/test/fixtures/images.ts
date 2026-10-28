import { spaceArt } from './space-art';

const SUBJECTS = ['Nebula', 'Apollo', 'Hubble', 'Mars', 'Jupiter', 'Galaxy', 'Saturn', 'Moon'];

/** Raw NASA Image Library search response (sample data). */
export function makeImageSearch(query: string, page: number, pageSize = 24, totalHits = 60) {
  const start = (page - 1) * pageSize;
  const count = Math.max(0, Math.min(pageSize, totalHits - start));
  const items = Array.from({ length: count }, (_, i) => {
    const n = start + i + 1;
    const id = `${query.toLowerCase().replace(/\W+/g, '-')}-${n}`;
    const subject = SUBJECTS[n % SUBJECTS.length];
    return {
      href: `https://images-assets.nasa.gov/image/${id}/collection.json`,
      data: [
        {
          nasa_id: id,
          title: `${query} ${subject} #${n} (sample)`,
          description: `Sample <b>${query}</b> result for offline demos.`,
          date_created: `20${String(10 + (n % 15)).padStart(2, '0')}-0${(n % 9) + 1}-15T00:00:00Z`,
          center: n % 2 ? 'GSFC' : 'JPL',
          photographer: n % 4 === 0 ? 'NASA/Sample' : undefined,
          keywords: [query, subject],
          media_type: 'image',
        },
      ],
      links: [{ href: spaceArt(id, 480, 320), rel: 'preview', render: 'image' }],
    };
  });
  return {
    collection: {
      version: '1.0',
      items,
      metadata: { total_hits: totalHits },
      links:
        start + count < totalHits
          ? [{ rel: 'next', prompt: 'Next', href: `?page=${page + 1}` }]
          : [],
    },
  };
}
