import { screen, waitFor, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { http, HttpResponse } from 'msw';
import { afterEach, describe, expect, it } from 'vitest';
import { SEARCH_URL } from '@/test/handlers';
import { captureObservability } from '@/test/observability';
import { renderRoute } from '@/test/render';
import { server } from '@/test/server';

let restore: (() => void) | undefined;
afterEach(() => restore?.());

describe('Explore page', () => {
  it('shows suggestions before searching', () => {
    renderRoute('/explore');
    expect(screen.getByText('What do you want to see?')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Nebula' })).toBeInTheDocument();
  });

  it('searches from the form, updates the URL and tracks without the raw query', async () => {
    const obs = captureObservability();
    restore = obs.restore;
    const { router } = renderRoute('/explore');

    await userEvent.type(screen.getByRole('searchbox', { name: /search nasa images/i }), 'saturn');
    await userEvent.click(screen.getByRole('button', { name: 'Search' }));

    await waitFor(() => expect(router.state.location.search).toBe('?q=saturn'));
    const list = await screen.findByRole('list', { name: 'Results for saturn' });
    expect(within(list).getAllByRole('button')).toHaveLength(24);
    expect(screen.getByRole('status')).toHaveTextContent('60 images for “saturn”');
    expect(obs.actions()).toContainEqual({
      name: 'search_performed',
      props: { query_len: 6, results: 60, suggested: false },
    });
  });

  it('marks suggestion searches and loads more pages', async () => {
    const obs = captureObservability();
    restore = obs.restore;
    renderRoute('/explore');
    await userEvent.click(screen.getByRole('button', { name: 'Mars' }));
    await screen.findByRole('list', { name: 'Results for Mars' });
    expect(obs.actions()).toContainEqual({
      name: 'search_performed',
      props: { query_len: 4, results: 60, suggested: true },
    });

    await userEvent.click(screen.getByRole('button', { name: 'Load more' }));
    await waitFor(() =>
      expect(
        within(screen.getByRole('list', { name: 'Results for Mars' })).getAllByRole('button'),
      ).toHaveLength(48),
    );
    expect(obs.actions()).toContainEqual({ name: 'search_more_loaded', props: { page: 2 } });
  });

  it('handles no results', async () => {
    renderRoute('/explore?q=nothing');
    expect(await screen.findByText('No results')).toBeInTheDocument();
    expect(screen.queryByRole('button', { name: 'Load more' })).not.toBeInTheDocument();
  });

  it('shows errors with retry', async () => {
    server.use(http.get(SEARCH_URL, () => HttpResponse.error()));
    renderRoute('/explore?q=apollo');
    expect(await screen.findByRole('alert')).toHaveTextContent(/could not reach nasa/i);
  });

  it('opens results in the lightbox', async () => {
    const obs = captureObservability();
    restore = obs.restore;
    renderRoute('/explore?q=hubble');
    const list = await screen.findByRole('list', { name: 'Results for hubble' });
    await userEvent.click(within(list).getAllByRole('button')[0]!);
    expect(obs.actions()).toContainEqual({ name: 'lightbox_opened', props: { source: 'explore' } });
  });
});
