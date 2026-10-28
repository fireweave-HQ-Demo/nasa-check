import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import { App } from '@/app/App';
import { initIdentity } from '@/app/identity';
import { config } from '@/lib/config';
import { initObservability } from '@/lib/observability';
import { startApiTiming } from '@/lib/observability/apiTiming';
import '@/styles/tokens.css';
import '@/styles/global.css';

async function bootstrap() {
  // Checked via import.meta.env directly so production builds drop the mock code entirely.
  if (import.meta.env.MODE === 'mock') {
    const { startMockWorker } = await import('@/test/browser');
    await startMockWorker();
  }

  // Observability loads lazily; calls made before it is ready are buffered.
  void initObservability(config);
  startApiTiming();
  initIdentity();

  createRoot(document.getElementById('root')!).render(
    <StrictMode>
      <App />
    </StrictMode>,
  );
}

void bootstrap();
