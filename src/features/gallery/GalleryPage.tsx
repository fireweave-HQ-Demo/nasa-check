import { useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { ImageGrid, ImageGridSkeleton, type GridItem } from '@/components/gallery/ImageGrid';
import { Lightbox, type LightboxSlide } from '@/components/media/Lightbox';
import { Button } from '@/components/ui/Button';
import { EmptyState } from '@/components/ui/EmptyState';
import { ErrorState } from '@/components/ui/ErrorState';
import { apodPreviewUrl } from '@/lib/nasa';
import { track } from '@/lib/observability';
import { formatDisplayDate } from '@/utils/dates';
import { truncate } from '@/utils/format';
import { GALLERY_PAGE_DAYS, useApodRange } from './useApodRange';

const PLACEHOLDER = '/favicon.svg';

export function GalleryPage() {
  const navigate = useNavigate();
  const query = useApodRange();
  const [openIndex, setOpenIndex] = useState<number | null>(null);

  const entries = useMemo(() => query.data?.pages.flatMap((p) => p.items) ?? [], [query.data]);
  const images = useMemo(() => entries.filter((e) => e.media_type === 'image' && e.url), [entries]);

  const items: GridItem[] = entries.map((apod) => ({
    id: apod.date,
    src: apodPreviewUrl(apod) ?? PLACEHOLDER,
    title: apod.title,
    subtitle: formatDisplayDate(apod.date),
    badge: apod.media_type === 'video' ? 'Video' : undefined,
  }));

  const slides: LightboxSlide[] = images.map((apod) => ({
    src: apod.hdurl ?? apod.url ?? '',
    alt: apod.title,
    title: apod.title,
    description: `${formatDisplayDate(apod.date)} — ${truncate(apod.explanation, 280)}`,
  }));

  const pageCount = query.data?.pages.length ?? 0;
  const lastPage = query.data?.pages[pageCount - 1];
  useEffect(() => {
    if (lastPage) {
      track('gallery_page_loaded', {
        range_days: GALLERY_PAGE_DAYS,
        count: lastPage.items.length,
        page: pageCount,
      });
    }
  }, [lastPage, pageCount]);

  const select = (index: number) => {
    const apod = entries[index];
    if (!apod) return;
    const imageIndex = images.indexOf(apod);
    if (imageIndex === -1) {
      navigate(`/today/${apod.date}`); // videos play on the Today page
      return;
    }
    track('lightbox_opened', { source: 'gallery' });
    setOpenIndex(imageIndex);
  };

  return (
    <div className="page">
      <div className="page-header">
        <p className="eyebrow">Gallery</p>
        <h1>The last {GALLERY_PAGE_DAYS * Math.max(1, pageCount)} days of APOD</h1>
        <p>
          Every Astronomy Picture of the Day, newest first. Select an image to view it full screen.
        </p>
      </div>

      {query.isPending && <ImageGridSkeleton />}
      {query.isError && !query.data && (
        <ErrorState error={query.error} onRetry={() => void query.refetch()} />
      )}
      {query.data && entries.length === 0 && <EmptyState title="No pictures in this range" />}
      {entries.length > 0 && (
        <ImageGrid items={items} onSelect={select} label="Astronomy pictures" />
      )}

      {query.isFetchNextPageError && (
        <ErrorState error={query.error} onRetry={() => void query.fetchNextPage()} />
      )}
      {query.hasNextPage && !query.isFetchNextPageError && (
        <div className="load-more">
          <Button onClick={() => void query.fetchNextPage()} disabled={query.isFetchingNextPage}>
            {query.isFetchingNextPage ? 'Loading…' : `Load ${GALLERY_PAGE_DAYS} older days`}
          </Button>
        </div>
      )}

      <Lightbox
        open={openIndex !== null}
        index={openIndex ?? 0}
        slides={slides}
        onClose={() => setOpenIndex(null)}
      />
    </div>
  );
}
