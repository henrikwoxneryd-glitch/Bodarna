/// <reference types="vite/client" />

interface ImportMetaEnv {
  readonly VITE_Bolt_Database_URL: string;
  readonly VITE_Bolt_Database_Bolt_Database_ANON_KEY: string;
}

interface ImportMeta {
  readonly env: ImportMetaEnv;
}
