import { screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { http, HttpResponse } from 'msw';
import { afterEach, describe, expect, it } from 'vitest';
import { APOD_URL, SCIENCE_URL } from '@/test/handlers';
import { captureObservability } from '@/test/observability';
import { renderRoute } from '@/test/render';
import { server } from '@/test/server';

let restore: (() => void) | undefined;
afterEach(() => restore?.());

describe('Today page', () => {
  it('shows the APOD for a date and tracks the view', async () => {
    const obs = captureObservability();
    restore = obs.restore;
    renderRoute('/today/2024-01-02');

    expect(screen.getByLabelText('Loading picture')).toBeInTheDocument();
    expect(
      await screen.findByRole('heading', { level: 2, name: /\(sample\)/ }),
    ).toBeInTheDocument();
    expect(screen.getByText('January 2, 2024')).toBeInTheDocument();
    expect(obs.actions()).toContainEqual({
      name: 'apod_viewed',
      props: { date: '2024-01-02', media_type: 'image', source: 'today' },
    });
  });

  it('navigates to the previous day', async () => {
    const { router } = renderRoute('/today/2024-01-02');
    await screen.findByText('January 2, 2024');
    await userEvent.click(screen.getByRole('button', { name: /previous/i }));
    await waitFor(() => expect(router.state.location.pathname).toBe('/today/2024-01-01'));
    expect(await screen.findByText('January 1, 2024')).toBeInTheDocument();
  });

  it('disables Previous on the first APOD date', async () => {
    renderRoute('/today/1995-06-16');
    await screen.findByText('June 16, 1995');
    expect(screen.getByRole('button', { name: /previous/i })).toBeDisabled();
  });

  it('embeds YouTube videos', async () => {
    server.use(
      http.get(APOD_URL, () =>
        HttpResponse.json({
          date: '2024-01-07',
          title: 'A video (sample)',
          explanation: '',
          media_type: 'video',
          url: 'https://www.youtube.com/embed/abc123',
        }),
      ),
    );
    renderRoute('/today/2024-01-07');
    expect(await screen.findByTitle(/\(sample\)/)).toHaveAttribute(
      'src',
      expect.stringContaining('youtube.com/embed'),
    );
  });

  it('falls back to a link for videos that cannot be embedded', async () => {
    renderRoute('/today/2024-01-07'); // sample data: every 7th day is a non-embeddable video
    expect(await screen.findByText(/can.t be shown inline/i)).toBeInTheDocument();
    expect(screen.getByRole('link', { name: 'Open on NASA' })).toHaveAttribute(
      'href',
      'https://apod.nasa.gov/apod/sample-video.html',
    );
  });

  it('opens the lightbox for images', async () => {
    const obs = captureObservability();
    restore = obs.restore;
    renderRoute('/today/2024-01-02');
    await userEvent.click(await screen.findByRole('button', { name: /open full screen/i }));
    expect(obs.actions()).toContainEqual({ name: 'lightbox_opened', props: { source: 'today' } });
  });

  it('explains rate limiting', async () => {
    server.use(http.get(SCIENCE_URL, () => HttpResponse.error())); // isolate api.nasa.gov behaviour
    server.use(
      http.get(APOD_URL, () =>
        HttpResponse.json({ error: { code: 'OVER_RATE_LIMIT' } }, { status: 429 }),
      ),
    );
    renderRoute('/today/2024-01-02');
    expect(await screen.findByRole('alert')).toHaveTextContent(/rate limit/i);
  });

  it('rejects dates outside the APOD range', () => {
    renderRoute('/today/1990-01-01');
    expect(screen.getByRole('alert')).toHaveTextContent(/isn.t available/i);
  });

  it('loads the latest picture on /', async () => {
    renderRoute('/');
    expect(
      await screen.findByRole('heading', { level: 1, name: "Today's picture" }),
    ).toBeInTheDocument();
    expect(
      await screen.findByRole('heading', { level: 2, name: /\(sample\)/ }),
    ).toBeInTheDocument();
  });
});
