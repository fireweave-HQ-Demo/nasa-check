import '@testing-library/jest-dom/vitest';
import { cleanup } from '@testing-library/react';
import { afterAll, afterEach, beforeAll } from 'vitest';
import { __resetApodSourceForTests } from '@/lib/nasa/apod';
import { server } from './server';

beforeAll(() => server.listen({ onUnhandledFrame: 'error' }));
afterEach(() => {
  server.resetHandlers();
  __resetApodSourceForTests();
  cleanup();
});
afterAll(() => server.close());

// jsdom doesn't implement scrolling; React Router's ScrollRestoration calls it.
window.scrollTo = () => undefined;
