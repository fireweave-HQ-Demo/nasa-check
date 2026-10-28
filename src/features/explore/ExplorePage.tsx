import { useEffect, useMemo, useRef, useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import { ImageGrid, ImageGridSkeleton, type GridItem } from '@/components/gallery/ImageGrid';
import { Lightbox, type LightboxSlide } from '@/components/media/Lightbox';
import { Button } from '@/components/ui/Button';
import { EmptyState } from '@/components/ui/EmptyState';
import { ErrorState } from '@/components/ui/ErrorState';
import { track } from '@/lib/observability';
import { formatCount, truncate } from '@/utils/format';
import { SearchBar } from './SearchBar';
import { useImageSearch } from './useImageSearch';
import './explore.css';

function year(iso: string): string {
  return iso.slice(0, 4);
}

export function ExplorePage() {
  const [params, setParams] = useSearchParams();
  const q = (params.get('q') ?? '').trim();
  const query = useImageSearch(q);
  const [openIndex, setOpenIndex] = useState<number | null>(null);
  const suggestedRef = useRef(false);

  const results = useMemo(() => query.data?.pages.flatMap((p) => p.items) ?? [], [query.data]);
  const totalHits = query.data?.pages[0]?.totalHits ?? 0;
  const pageCount = query.data?.pages.length ?? 0;

  useEffect(() => {
    if (!q || !query.data) return;
    if (pageCount === 1) {
      track('search_performed', {
        query_len: q.length,
        results: totalHits,
        suggested: suggestedRef.current,
      });
    } else {
      track('search_more_loaded', { page: pageCount });
    }
  }, [q, query.data, pageCount, totalHits]);

  const search = (next: string, suggested: boolean) => {
    suggestedRef.current = suggested;
    setOpenIndex(null);
    setParams({ q: next });
  };

  const items: GridItem[] = results.map((item) => ({
    id: item.nasaId,
    src: item.thumbUrl,
    title: item.title,
    subtitle: [item.center, item.dateCreated && year(item.dateCreated)].filter(Boolean).join(' · '),
  }));

  const slides: LightboxSlide[] = results.map((item) => ({
    src: item.largeUrl,
    alt: item.title,
    title: item.title,
    description: [
      item.description && truncate(item.description, 300),
      `NASA ID: ${item.nasaId}${item.photographer ? ` · Credit: ${item.photographer}` : ''}`,
    ]
      .filter(Boolean)
      .join('\n'),
  }));

  return (
    <div className="page">
      <div className="page-header">
        <p className="eyebrow">Explore</p>
        <h1>Search the NASA Image Library</h1>
        <p>Over 140,000 images from NASA missions, telescopes and astronauts.</p>
      </div>

      <SearchBar key={q} value={q} onSearch={search} />

      {!q && (
        <EmptyState title="What do you want to see?">
          Try a suggestion above, or search for a mission, planet or object.
        </EmptyState>
      )}

      {q && query.isPending && <ImageGridSkeleton />}
      {q && query.isError && !query.data && (
        <ErrorState error={query.error} onRetry={() => void query.refetch()} />
      )}

      {q && query.data && (
        <>
          <p className="muted" role="status">
            {totalHits === 0
              ? `No images found for “${q}”.`
              : `${formatCount(totalHits)} images for “${q}”`}
          </p>
          {results.length === 0 ? (
            <EmptyState title="No results">
              Try a broader term, like “galaxy” or “Apollo 11”.
            </EmptyState>
          ) : (
            <ImageGrid
              items={items}
              label={`Results for ${q}`}
              onSelect={(index) => {
                track('lightbox_opened', { source: 'explore' });
                setOpenIndex(index);
              }}
            />
          )}
        </>
      )}

      {query.isFetchNextPageError && (
        <ErrorState error={query.error} onRetry={() => void query.fetchNextPage()} />
      )}
      {q && query.hasNextPage && !query.isFetchNextPageError && (
        <div className="load-more">
          <Button onClick={() => void query.fetchNextPage()} disabled={query.isFetchingNextPage}>
            {query.isFetchingNextPage ? 'Loading…' : 'Load more'}
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
