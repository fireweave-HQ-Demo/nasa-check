import { http, HttpResponse } from 'msw';
import { describe, expect, it, vi } from 'vitest';
import { readConfig } from '@/lib/config';
import { getApod } from '@/lib/nasa';
import { server } from '@/test/server';
import { APOD_URL } from '@/test/handlers';
import { startApiTiming } from './apiTiming';
import { __setSinkForTests, initObservability, track } from './index';
import { BufferedSink, type ObservabilitySink } from './sink';

function fakeSink() {
  return {
    setUser: vi.fn(),
    clearUser: vi.fn(),
    setGlobal: vi.fn(),
    action: vi.fn(),
    log: vi.fn(),
  } satisfies ObservabilitySink;
}

describe('BufferedSink', () => {
  it('buffers calls until attached, then replays them in order', () => {
    const buffered = new BufferedSink();
    buffered.setUser({ id: 'dev_1' });
    buffered.action('a', { x: 1 });
    const target = fakeSink();
    buffered.attach(target);
    expect(target.setUser).toHaveBeenCalledWith({ id: 'dev_1' });
    expect(target.action).toHaveBeenCalledWith('a', { x: 1 });
    buffered.action('b', {});
    expect(target.action).toHaveBeenLastCalledWith('b', {});
  });

  it('drops calls when disabled and never throws if the target throws', () => {
    const buffered = new BufferedSink();
    buffered.disable();
    buffered.action('ignored', {});
    const target = {
      ...fakeSink(),
      action: vi.fn(() => {
        throw new Error('boom');
      }),
    };
    const other = new BufferedSink();
    other.attach(target);
    expect(() => other.action('x', {})).not.toThrow();
  });
});

describe('initObservability', () => {
  it('is a no-op without configuration', async () => {
    expect(await initObservability(readConfig({ VITE_APP_ENV: 'test' }, '1.0.0'))).toBe(false);
  });
});

describe('api timing', () => {
  it('tracks api_call for success and api_error + log for failures', async () => {
    const fake = fakeSink();
    const restore = __setSinkForTests(fake);
    const stop = startApiTiming();

    await getApod('2024-01-01');
    server.use(http.get(APOD_URL, () => HttpResponse.json({}, { status: 429 })));
    await getApod('2024-01-02').catch(() => undefined);

    stop();
    restore();
    expect(fake.action).toHaveBeenCalledWith(
      'api_call',
      expect.objectContaining({ endpoint: 'apod', status: 200 }),
    );
    expect(fake.action).toHaveBeenCalledWith('api_error', {
      endpoint: 'apod',
      status: 429,
      kind: 'rate_limited',
    });
    expect(fake.log).toHaveBeenCalledWith(
      'warn',
      'NASA API apod failed',
      expect.objectContaining({ status: 429 }),
    );
  });

  it('track() forwards typed events', () => {
    const fake = fakeSink();
    const restore = __setSinkForTests(fake);
    track('lightbox_opened', { source: 'gallery' });
    restore();
    expect(fake.action).toHaveBeenCalledWith('lightbox_opened', { source: 'gallery' });
  });
});
