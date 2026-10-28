/**
 * Single place that reads and validates configuration.
 *
 * Two sources, highest priority first:
 *  1. Runtime config: window.__APP_CONFIG__ from /config.js, generated when the Docker container
 *     starts (docker/40-runtime-config.sh). One image works with any keys.
 *  2. Build-time VITE_* variables (used by `npm run dev` via .env.local).
 *
 * Everything here ends up in the browser, so only browser-safe values belong here.
 */

export type ObservabilityConfig = {
  site: string;
  organizationIdentifier: string;
  applicationId: string;
  clientToken: string;
};

export type AppConfig = {
  nasaApiKey: string;
  usingDemoKey: boolean;
  env: string;
  version: string;
  mockApi: boolean;
  observability: ObservabilityConfig | null;
};

type Env = Partial<Record<string, string | boolean | undefined>>;

/** Keys allowed in /config.js (keep in sync with docker/40-runtime-config.sh). */
export type RuntimeConfig = Partial<
  Record<
    | 'NASA_API_KEY'
    | 'APP_ENV'
    | 'FIREWEAVE_BROWSER_KEY'
    | 'FIREWEAVE_URL'
    | 'OO_SITE'
    | 'OO_ORG'
    | 'OO_APP_ID'
    | 'OO_CLIENT_TOKEN',
    string
  >
>;

declare global {
  interface Window {
    __APP_CONFIG__?: RuntimeConfig;
  }
}

const str = (value: unknown): string => (typeof value === 'string' ? value.trim() : '');

export function readConfig(env: Env, version: string, runtime: RuntimeConfig = {}): AppConfig {
  const pick = (runtimeKey: keyof RuntimeConfig, viteKey: string) =>
    str(runtime[runtimeKey]) || str(env[viteKey]);

  const key = pick('NASA_API_KEY', 'VITE_NASA_API_KEY');
  const site = pick('OO_SITE', 'VITE_OO_SITE') || 'api.openobserve.ai';
  const organizationIdentifier = pick('OO_ORG', 'VITE_OO_ORG');
  const applicationId = pick('OO_APP_ID', 'VITE_OO_APP_ID');
  const clientToken = pick('OO_CLIENT_TOKEN', 'VITE_OO_CLIENT_TOKEN');
  const mode = str(env.MODE);

  return {
    nasaApiKey: key || 'DEMO_KEY',
    usingDemoKey: !key || key === 'DEMO_KEY',
    env: pick('APP_ENV', 'VITE_APP_ENV') || (env.PROD ? 'production' : 'development'),
    version,
    mockApi: mode === 'mock',
    observability:
      organizationIdentifier && applicationId && clientToken
        ? { site, organizationIdentifier, applicationId, clientToken }
        : null,
  };
}

function runtimeConfig(): RuntimeConfig {
  if (typeof window === 'undefined') return {};
  const value = window.__APP_CONFIG__;
  return value && typeof value === 'object' ? value : {};
}

export const config: AppConfig = readConfig(
  import.meta.env as Env,
  typeof __APP_VERSION__ === 'string' ? __APP_VERSION__ : '0.0.0',
  runtimeConfig(),
);
