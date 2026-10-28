import type { AppConfig } from '@/lib/config';
import type { EventMap, EventName } from './events';
import { BufferedSink, type ObservabilitySink } from './sink';

export type { EventMap, EventName } from './events';
export type { ObservabilitySink } from './sink';

const SERVICE = 'nasa-explorer';
const RELEASE = 'r1';

let sink = new BufferedSink();

/**
 * Start observability. The OpenObserve SDK is imported lazily, and only when configured;
 * without configuration every call is a no-op and the app works normally.
 */
export async function initObservability(config: AppConfig): Promise<boolean> {
  if (!config.observability) {
    sink.disable();
    if (config.env !== 'test') {
      console.info('[observability] OpenObserve not configured; telemetry disabled.');
    }
    return false;
  }
  try {
    const { createOpenObserveSink } = await import('./openobserve');
    const target = createOpenObserveSink({
      ...config.observability,
      service: SERVICE,
      env: config.env,
      version: config.version,
    });
    target.setGlobal('release', RELEASE);
    target.setGlobal('app_version', config.version);
    sink.attach(target);
    return true;
  } catch (error) {
    console.warn('[observability] failed to start; telemetry disabled.', error);
    sink.disable();
    return false;
  }
}

export function setUser(user: { id: string }) {
  sink.setUser(user);
}

export function clearUser() {
  sink.clearUser();
}

export function track<K extends EventName>(name: K, properties: EventMap[K]) {
  sink.action(name, properties as Record<string, unknown>);
}

export function log(
  level: 'info' | 'warn' | 'error',
  message: string,
  context: Record<string, unknown> = {},
) {
  sink.log(level, message, context);
}

/** Test helper: route all calls to a fake sink. Returns a restore function. */
export function __setSinkForTests(fake: ObservabilitySink): () => void {
  const previous = sink;
  const buffered = new BufferedSink();
  buffered.attach(fake);
  sink = buffered;
  return () => {
    sink = previous;
  };
}
