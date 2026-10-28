import { vi } from 'vitest';
import { __setSinkForTests, type ObservabilitySink } from '@/lib/observability';

/** Capture observability calls in a test. Call `restore()` when done (or rely on afterEach). */
export function captureObservability() {
  const sink = {
    setUser: vi.fn(),
    clearUser: vi.fn(),
    setGlobal: vi.fn(),
    action: vi.fn(),
    log: vi.fn(),
  } satisfies ObservabilitySink;
  const restore = __setSinkForTests(sink);
  const actions = () => sink.action.mock.calls.map(([name, props]) => ({ name, props }));
  return { sink, restore, actions };
}
