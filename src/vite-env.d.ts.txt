/// <reference types="vite/client" />

interface ImportMetaEnv {
  readonly VITE_Bolt Database_URL: string;
  readonly VITE_Bolt Database_Bolt Database_ANON_KEY: string;
}

interface ImportMeta {
  readonly env: ImportMetaEnv;
}
