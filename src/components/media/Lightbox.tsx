import { lazy, Suspense } from 'react';

export type LightboxSlide = {
  src: string;
  alt: string;
  title?: string;
  description?: string;
};

type Props = {
  slides: LightboxSlide[];
  index: number;
  open: boolean;
  onClose: () => void;
};

// Loaded on first open so the lightbox doesn't weigh down the initial bundle.
const LightboxImpl = lazy(() => import('./LightboxImpl'));

export function Lightbox(props: Props) {
  if (!props.open) return null;
  return (
    <Suspense fallback={null}>
      <LightboxImpl {...props} />
    </Suspense>
  );
}
