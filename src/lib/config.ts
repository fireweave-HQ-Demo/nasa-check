/**
 * Single place that reads and validates build-time environment (VITE_*).
 * Everything here ends up in the browser bundle, so only browser-safe values belong here.
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

const str = (value: unknown): string => (typeof value === 'string' ? value.trim() : '');

export function readConfig(env: Env, version: string): AppConfig {
  const key = str(env.VITE_NASA_API_KEY);
  const site = str(env.VITE_OO_SITE) || 'api.openobserve.ai';
  const organizationIdentifier = str(env.VITE_OO_ORG);
  const applicationId = str(env.VITE_OO_APP_ID);
  const clientToken = str(env.VITE_OO_CLIENT_TOKEN);
  const mode = str(env.MODE);

  return {
    nasaApiKey: key || 'DEMO_KEY',
    usingDemoKey: !key || key === 'DEMO_KEY',
    env: str(env.VITE_APP_ENV) || (env.PROD ? 'production' : 'development'),
    version,
    mockApi: mode === 'mock',
    observability:
      organizationIdentifier && applicationId && clientToken
        ? { site, organizationIdentifier, applicationId, clientToken }
        : null,
  };
}

export const config: AppConfig = readConfig(
  import.meta.env as Env,
  typeof __APP_VERSION__ === 'string' ? __APP_VERSION__ : '0.0.0',
);
