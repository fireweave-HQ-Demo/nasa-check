export type GridItem = {
  id: string;
  src: string;
  title: string;
  subtitle?: string;
  badge?: string;
};

export function ImageCard({ item, onSelect }: { item: GridItem; onSelect: () => void }) {
  return (
    <button type="button" className="card" onClick={onSelect} aria-label={`Open ${item.title}`}>
      <div className="card__media">
        <img src={item.src} alt="" loading="lazy" decoding="async" />
        {item.badge && <span className="card__badge">{item.badge}</span>}
      </div>
      <div className="card__body">
        <span className="card__title">{item.title}</span>
        {item.subtitle && <span className="card__subtitle">{item.subtitle}</span>}
      </div>
    </button>
  );
}
