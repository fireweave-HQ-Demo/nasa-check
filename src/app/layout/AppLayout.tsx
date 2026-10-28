import { Outlet, ScrollRestoration } from 'react-router-dom';
import { config } from '@/lib/config';
import { Footer } from './Footer';
import { Header } from './Header';

export function AppLayout() {
  return (
    <>
      <a href="#main" className="skip-link">
        Skip to content
      </a>
      <Header />
      <main id="main" className="container" tabIndex={-1}>
        {config.mockApi && (
          <p className="banner" style={{ marginTop: 'var(--space-4)' }}>
            Offline demo mode: showing generated sample data instead of live NASA responses.
          </p>
        )}
        {!config.mockApi && config.usingDemoKey && config.env !== 'production' && (
          <p className="banner" style={{ marginTop: 'var(--space-4)' }}>
            Using NASA&apos;s shared DEMO_KEY, which has low rate limits. Set VITE_NASA_API_KEY in
            .env.local for a personal key.
          </p>
        )}
        <Outlet />
      </main>
      <Footer />
      <ScrollRestoration />
    </>
  );
}
