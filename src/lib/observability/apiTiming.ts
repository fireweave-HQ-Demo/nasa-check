import { onRequestTiming, type RequestTiming } from '@/lib/nasa';
import { log, track } from './index';

export function reportTiming(t: RequestTiming) {
  if (t.errorKind === 'aborted') return; // navigation away, not a real failure
  track('api_call', { endpoint: t.endpoint, status: t.status, duration_ms: t.durationMs });
  if (!t.ok) {
    track('api_error', { endpoint: t.endpoint, status: t.status, kind: t.errorKind ?? 'unknown' });
    log(t.errorKind === 'rate_limited' ? 'warn' : 'error', `NASA API ${t.endpoint} failed`, {
      endpoint: t.endpoint,
      status: t.status,
      kind: t.errorKind,
      duration_ms: t.durationMs,
    });
  }
}

/** Forward NASA request timings to observability. Returns an unsubscribe function. */
export function startApiTiming(): () => void {
  return onRequestTiming(reportTiming);
}
