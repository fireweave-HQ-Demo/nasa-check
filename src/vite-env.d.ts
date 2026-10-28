/// <reference types="vite/client" />

declare const __APP_VERSION__: string;

interface ImportMetaEnv {
  readonly VITE_NASA_API_KEY?: string;
  readonly VITE_OO_SITE?: string;
  readonly VITE_OO_ORG?: string;
  readonly VITE_OO_APP_ID?: string;
  readonly VITE_OO_CLIENT_TOKEN?: string;
  readonly VITE_APP_ENV?: string;
}

interface ImportMeta {
  readonly env: ImportMetaEnv;
}
