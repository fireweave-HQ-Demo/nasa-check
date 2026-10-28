import type { NasaErrorKind } from './types';

export const APOD_BASE = 'https://api.nasa.gov';
export const IMAGES_BASE = 'https://images-api.nasa.gov';

export class NasaApiError extends Error {
  readonly kind: NasaErrorKind;
  readonly status?: number;
  readonly endpoint: string;

  constructor(kind: NasaErrorKind, endpoint: string, message: string, status?: number) {
    super(message);
    this.name = 'NasaApiError';
    this.kind = kind;
    this.endpoint = endpoint;
    this.status = status;
  }

  /** Errors worth retrying automatically. */
  get retryable(): boolean {
    return this.kind === 'server' || this.kind === 'network' || this.kind === 'timeout';
  }
}

export type RequestTiming = {
  endpoint: string;
  status: number;
  durationMs: number;
  ok: boolean;
  errorKind?: NasaErrorKind;
};

type TimingListener = (timing: RequestTiming) => void;
const listeners = new Set<TimingListener>();

/** Subscribe to request timings (used by observability). Returns an unsubscribe function. */
export function onRequestTiming(listener: TimingListener): () => void {
  listeners.add(listener);
  return () => listeners.delete(listener);
}

function emitTiming(timing: RequestTiming) {
  for (const listener of listeners) {
    try {
      listener(timing);
    } catch {
      // A broken listener must never break a request.
    }
  }
}

function kindForStatus(status: number, body: string): NasaErrorKind {
  if (status === 429 || body.includes('OVER_RATE_LIMIT')) return 'rate_limited';
  if (status === 403 || body.includes('API_KEY_INVALID') || body.includes('API_KEY_MISSING'))
    return 'invalid_key';
  if (status === 404) return 'not_found';
  if (status >= 500) return 'server';
  return 'bad_request';
}

function messageFromBody(body: string, fallback: string): string {
  try {
    const parsed = JSON.parse(body) as {
      msg?: string;
      reason?: string;
      error?: { message?: string } | string;
    };
    if (parsed.msg) return parsed.msg;
    if (parsed.reason) return parsed.reason;
    if (typeof parsed.error === 'string') return parsed.error;
    if (parsed.error?.message) return parsed.error.message;
  } catch {
    // not JSON
  }
  return fallback;
}

export type GetJsonOptions = { signal?: AbortSignal; timeoutMs?: number };

/**
 * GET a JSON resource with a timeout, typed errors and timing events.
 * `endpoint` is a low-cardinality label such as "apod" or "images.search".
 */
export async function getJson<T>(
  endpoint: string,
  url: URL,
  { signal, timeoutMs = 10_000 }: GetJsonOptions = {},
): Promise<T> {
  const controller = new AbortController();
  let timedOut = false;
  const timer = setTimeout(() => {
    timedOut = true;
    controller.abort();
  }, timeoutMs);
  const onAbort = () => controller.abort();
  if (signal) {
    if (signal.aborted) controller.abort();
    else signal.addEventListener('abort', onAbort, { once: true });
  }

  const started = performance.now();
  const finish = (status: number, errorKind?: NasaErrorKind) =>
    emitTiming({
      endpoint,
      status,
      durationMs: Math.round(performance.now() - started),
      ok: !errorKind,
      errorKind,
    });

  try {
    let response: Response;
    try {
      response = await fetch(url, {
        signal: controller.signal,
        headers: { Accept: 'application/json' },
      });
    } catch {
      const kind: NasaErrorKind = timedOut ? 'timeout' : signal?.aborted ? 'aborted' : 'network';
      finish(0, kind);
      throw new NasaApiError(
        kind,
        endpoint,
        kind === 'timeout'
          ? 'NASA took too long to respond.'
          : kind === 'aborted'
            ? 'Request cancelled.'
            : 'Could not reach NASA. Check your connection.',
      );
    }

    if (!response.ok) {
      const body = await response.text().catch(() => '');
      const kind = kindForStatus(response.status, body);
      finish(response.status, kind);
      throw new NasaApiError(
        kind,
        endpoint,
        messageFromBody(body, `NASA responded with ${response.status}.`),
        response.status,
      );
    }

    const data = (await response.json()) as T;
    finish(response.status);
    return data;
  } finally {
    clearTimeout(timer);
    signal?.removeEventListener('abort', onAbort);
  }
}
