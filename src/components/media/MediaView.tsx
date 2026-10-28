import { ExternalLink } from '@/components/ui/Button';

export type Media = {
  kind: 'image' | 'video' | 'other';
  src?: string;
  thumbnail?: string;
  title: string;
};

const EMBED_HOSTS = [
  'www.youtube.com',
  'youtube.com',
  'www.youtube-nocookie.com',
  'player.vimeo.com',
];

function embeddable(src: string): boolean {
  try {
    return EMBED_HOSTS.includes(new URL(src).hostname);
  } catch {
    return false;
  }
}

/** Renders an APOD-style media entry: zoomable image, embedded video, or a link fallback. */
export function MediaView({ media, onOpen }: { media: Media; onOpen?: () => void }) {
  if (media.kind === 'image' && media.src) {
    const img = <img src={media.src} alt={media.title} decoding="async" />;
    return (
      <div className="media">
        {onOpen ? (
          <button
            type="button"
            className="media__button"
            onClick={onOpen}
            aria-label={`Open full screen: ${media.title}`}
          >
            {img}
          </button>
        ) : (
          img
        )}
      </div>
    );
  }

  if (media.kind === 'video' && media.src && embeddable(media.src)) {
    return (
      <div className="media">
        <iframe
          className="media__frame"
          src={media.src}
          title={media.title}
          loading="lazy"
          allow="accelerometer; encrypted-media; gyroscope; picture-in-picture; fullscreen"
          allowFullScreen
        />
      </div>
    );
  }

  if (media.kind === 'video' && media.src && /\.(mp4|webm|mov)$/i.test(media.src)) {
    return (
      <div className="media">
        <video
          src={media.src}
          poster={media.thumbnail}
          controls
          playsInline
          className="media__frame"
        />
      </div>
    );
  }

  return (
    <div className="media">
      <div className="media__fallback">
        {media.thumbnail && <img src={media.thumbnail} alt="" />}
        <p className="muted">This entry can&apos;t be shown inline.</p>
        {media.src && <ExternalLink href={media.src}>Open on NASA</ExternalLink>}
      </div>
    </div>
  );
}
