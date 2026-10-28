import type { SciencePost } from '@/lib/nasa/scienceApod';

const MONTHS = [
  'January',
  'February',
  'March',
  'April',
  'May',
  'June',
  'July',
  'August',
  'September',
  'October',
  'November',
  'December',
];

type Options = {
  title?: string;
  explanation?: string;
  credit?: [label: string, value: string];
  media?: string;
  featured?: string;
};

/** A science.nasa.gov image-article post, mirroring the real markup closely enough to parse. */
export function makeSciencePost(date: string, options: Options = {}): SciencePost {
  const [y, m, d] = date.split('-').map(Number) as [number, number, number];
  const title = options.title ?? `Sample Nebula &#8211; ${date}`;
  const explanation =
    options.explanation ?? 'What&#8217;s cooking on <a href="#">Io</a>? A sample explanation.';
  const [label, value] = options.credit ?? ['Credit &amp; Copyright:', 'Sample Photographer'];
  return {
    date: `${date}T00:05:00`,
    link: `https://science.nasa.gov/image-article/apod-${date}/`,
    title: { rendered: `APOD: ${y} ${MONTHS[m - 1]} ${d} &#8211; ${title}` },
    featured_image_url:
      options.featured ?? `https://assets.science.nasa.gov/apod/${date}.jpg?w=581&h=900&fit=clip`,
    content: {
      rendered: `
        <div class="hds-secondary-navigation-wrapper"><nav><a href="/apod/">Today&#8217;s APOD</a></nav></div>
        <p>Discover the cosmos! Each day a different image or photograph of our fascinating universe is featured.</p>
        ${options.media ?? ''}
        <p class="p-md margin-0 media-detail-hero__description"><strong>Explanation:</strong> ${explanation}<br><br><strong>Tomorrow&#8217;s picture:</strong> something else</p>
        <table><tr class="media-detail-hero__meta-row"><th class="label">Date</th><td>${MONTHS[m - 1]} ${d}, ${y}</td></tr>
        <tr class="media-detail-hero__meta-row"><th class="label">${label}</th><td class="p-sm">${value}</td></tr></table>
        <p>Authors &amp; editors: Robert Nemiroff (MTU) &amp; Jerry Bonnell (UMCP)</p>`,
    },
  };
}
