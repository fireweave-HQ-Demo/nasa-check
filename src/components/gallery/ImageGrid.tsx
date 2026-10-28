import { Skeleton } from '@/components/ui/Skeleton';
import { ImageCard, type GridItem } from './ImageCard';

export type { GridItem } from './ImageCard';

export function ImageGrid({
  items,
  onSelect,
  label,
}: {
  items: GridItem[];
  onSelect: (index: number) => void;
  label: string;
}) {
  return (
    <ul className="grid" aria-label={label} style={{ listStyle: 'none', padding: 0, margin: 0 }}>
      {items.map((item, index) => (
        <li key={item.id} style={{ display: 'grid' }}>
          <ImageCard item={item} onSelect={() => onSelect(index)} />
        </li>
      ))}
    </ul>
  );
}

export function ImageGridSkeleton({ count = 12 }: { count?: number }) {
  return (
    <div className="grid" aria-busy="true" aria-label="Loading images">
      {Array.from({ length: count }, (_, i) => (
        <div key={i} className="card" style={{ cursor: 'default' }}>
          <Skeleton height="auto" style={{ aspectRatio: '4 / 3', borderRadius: 0 }} />
          <div className="card__body">
            <Skeleton width="80%" height={14} />
            <Skeleton width="40%" height={12} />
          </div>
        </div>
      ))}
    </div>
  );
}
