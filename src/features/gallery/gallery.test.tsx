import { screen, waitFor, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { http, HttpResponse } from 'msw';
import { afterEach, describe, expect, it } from 'vitest';
import { APOD_URL, SCIENCE_URL } from '@/test/handlers';
import { captureObservability } from '@/test/observability';
import { renderRoute } from '@/test/render';
import { server } from '@/test/server';

let restore: (() => void) | undefined;
afterEach(() => restore?.());

describe('Gallery page', () => {
  it('shows 30 days newest first and tracks the page load', async () => {
    const obs = captureObservability();
    restore = obs.restore;
    renderRoute('/gallery');

    expect(screen.getByLabelText('Loading images')).toBeInTheDocument();
    const list = await screen.findByRole('list', { name: 'Astronomy pictures' });
    const cards = within(list).getAllByRole('button');
    expect(cards).toHaveLength(30);
    expect(obs.actions()).toContainEqual({
      name: 'gallery_page_loaded',
      props: { range_days: 30, count: 30, page: 1 },
    });
  });

  it('loads older days', async () => {
    renderRoute('/gallery');
    await screen.findByRole('list', { name: 'Astronomy pictures' });
    await userEvent.click(screen.getByRole('button', { name: /load 30 older days/i }));
    await waitFor(() =>
      expect(
        within(screen.getByRole('list', { name: 'Astronomy pictures' })).getAllByRole('button'),
      ).toHaveLength(60),
    );
  });

  it('marks videos and sends them to the Today page', async () => {
    const { router } = renderRoute('/gallery');
    await screen.findByRole('list', { name: 'Astronomy pictures' });
    const video = screen.getAllByText('Video')[0]!.closest('button')!;
    await userEvent.click(video);
    await waitFor(() =>
      expect(router.state.location.pathname).toMatch(/^\/today\/\d{4}-\d{2}-(07|14|21|28)$/),
    );
  });

  it('opens images in the lightbox', async () => {
    const obs = captureObservability();
    restore = obs.restore;
    renderRoute('/gallery');
    const list = await screen.findByRole('list', { name: 'Astronomy pictures' });
    const image = within(list)
      .getAllByRole('button')
      .find((b) => !within(b).queryByText('Video'))!;
    await userEvent.click(image);
    expect(obs.actions()).toContainEqual({ name: 'lightbox_opened', props: { source: 'gallery' } });
  });

  it('falls back to yesterday when today is not published', async () => {
    server.use(http.get(SCIENCE_URL, () => HttpResponse.error())); // isolate api.nasa.gov behaviour
    let calls = 0;
    server.use(
      http.get(APOD_URL, ({ request }) => {
        calls++;
        if (calls === 1)
          return HttpResponse.json({ code: 400, msg: 'Date must be between' }, { status: 400 });
        const url = new URL(request.url);
        return HttpResponse.json([
          {
            date: url.searchParams.get('end_date'),
            title: 'Yesterday',
            explanation: '',
            media_type: 'image',
            url: 'u',
          },
        ]);
      }),
    );
    renderRoute('/gallery');
    expect(await screen.findByText('Yesterday')).toBeInTheDocument();
  });

  it('shows an error with retry', async () => {
    server.use(http.get(SCIENCE_URL, () => HttpResponse.error())); // isolate api.nasa.gov behaviour
    server.use(http.get(APOD_URL, () => new HttpResponse(null, { status: 503 })));
    renderRoute('/gallery');
    const alert = await screen.findByRole('alert');
    expect(alert).toHaveTextContent(/trouble/i);
    expect(within(alert).getByRole('button', { name: /try again/i })).toBeInTheDocument();
  });
});
