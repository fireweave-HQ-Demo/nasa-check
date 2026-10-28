import YarLightbox from 'yet-another-react-lightbox';
import Captions from 'yet-another-react-lightbox/plugins/captions';
import Zoom from 'yet-another-react-lightbox/plugins/zoom';
import 'yet-another-react-lightbox/styles.css';
import 'yet-another-react-lightbox/plugins/captions.css';
import type { LightboxSlide } from './Lightbox';

type Props = { slides: LightboxSlide[]; index: number; open: boolean; onClose: () => void };

export default function LightboxImpl({ slides, index, open, onClose }: Props) {
  return (
    <YarLightbox
      open={open}
      close={onClose}
      index={index}
      slides={slides}
      plugins={[Captions, Zoom]}
      captions={{ descriptionTextAlign: 'start', descriptionMaxLines: 4 }}
      zoom={{ maxZoomPixelRatio: 3 }}
      controller={{ closeOnBackdropClick: true }}
      carousel={{ finite: slides.length <= 1 }}
      render={slides.length <= 1 ? { buttonPrev: () => null, buttonNext: () => null } : undefined}
    />
  );
}
