import type { CSSProperties } from 'react';

export function Skeleton({
  width = '100%',
  height = 16,
  style,
}: {
  width?: CSSProperties['width'];
  height?: CSSProperties['height'];
  style?: CSSProperties;
}) {
  return <div className="skeleton" aria-hidden="true" style={{ width, height, ...style }} />;
}
