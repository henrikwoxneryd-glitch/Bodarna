/// <reference types="vite/client" />

interface ImportMetaEnv {
  readonly VITE_BoltDatabase_URL: string;
  readonly VITE_BoltDatabase_ANON_KEY: string;
}

interface ImportMeta {
  readonly env: ImportMetaEnv;
}