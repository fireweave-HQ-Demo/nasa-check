import { describe, expect, it } from 'vitest';
import { readConfig } from './config';

describe('readConfig', () => {
  it('falls back to DEMO_KEY and disables observability without config', () => {
    const c = readConfig({}, '1.0.0');
    expect(c.nasaApiKey).toBe('DEMO_KEY');
    expect(c.usingDemoKey).toBe(true);
    expect(c.observability).toBeNull();
  });

  it('enables observability only when org, app id and token are all set', () => {
    const partial = readConfig({ VITE_OO_ORG: 'org', VITE_OO_APP_ID: 'app' }, '1.0.0');
    expect(partial.observability).toBeNull();
    const full = readConfig(
      {
        VITE_NASA_API_KEY: ' abc ',
        VITE_OO_ORG: 'org',
        VITE_OO_APP_ID: 'app',
        VITE_OO_CLIENT_TOKEN: 'tok',
        MODE: 'mock',
      },
      '1.2.3',
    );
    expect(full.nasaApiKey).toBe('abc');
    expect(full.usingDemoKey).toBe(false);
    expect(full.mockApi).toBe(true);
    expect(full.observability).toEqual({
      site: 'api.openobserve.ai',
      organizationIdentifier: 'org',
      applicationId: 'app',
      clientToken: 'tok',
    });
  });
});
