import { setupWorker } from 'msw/browser';
import { handlers, withLatency } from './handlers';

/** In-browser mock API for `npm run dev:mock` (offline demos). */
export async function startMockWorker() {
  const worker = setupWorker(withLatency, ...handlers);
  await worker.start({ onUnhandledFrame: 'bypass', quiet: true });
}
