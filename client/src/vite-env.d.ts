/// <reference types="vite/client" />

/** The moment the site was built (ISO), written in by vite.config.ts. */
declare const __BUILD_DATE__: string;

interface ImportMetaEnv {
  readonly VITE_SITE_URL?: string;
  readonly VITE_SITE_NAME?: string;
}

interface ImportMeta {
  readonly env: ImportMetaEnv;
}
