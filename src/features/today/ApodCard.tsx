import { MediaView } from '@/components/media/MediaView';
import { ExternalLink } from '@/components/ui/Button';
import { apodPageUrl, type Apod } from '@/lib/nasa';
import { formatDisplayDate } from '@/utils/dates';

export function ApodCard({ apod, onOpen }: { apod: Apod; onOpen: () => void }) {
  return (
    <article className="apod">
      <MediaView
        media={{
          kind: apod.media_type,
          src: apod.url,
          thumbnail: apod.thumbnail_url,
          title: apod.title,
        }}
        onOpen={apod.media_type === 'image' ? onOpen : undefined}
      />
      <div className="apod__body">
        <header className="apod__header">
          <p className="eyebrow">
            <time dateTime={apod.date}>{formatDisplayDate(apod.date)}</time>
          </p>
          <h2 className="apod__title">{apod.title}</h2>
          {apod.copyright && (
            <p className="muted">© {apod.copyright.replace(/\s+/g, ' ').trim()}</p>
          )}
        </header>
        <p className="apod__explanation">{apod.explanation}</p>
        <div className="row">
          {apod.hdurl && (
            <ExternalLink href={apod.hdurl} variant="ghost">
              View HD image ↗
            </ExternalLink>
          )}
          <ExternalLink href={apodPageUrl(apod)} variant="ghost">
            On {apod.source === 'science.nasa.gov' ? 'science.nasa.gov' : 'apod.nasa.gov'} ↗
          </ExternalLink>
        </div>
      </div>
    </article>
  );
}
