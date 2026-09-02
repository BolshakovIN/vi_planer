/// <reference types="vite/client" />

interface ImportMetaEnv {
  readonly VITE_SUPABASE_URL?: string;
  readonly VITE_SUPABASE_ANON_KEY?: string;
  readonly VITE_BASE_PATH?: string;
  /** Remote API base URL (e.g. Railway). Empty = same origin /api proxy in dev. */
  readonly VITE_API_URL?: string;
  /** GitHub Pages: localStorage only, no API calls */
  readonly VITE_LOCAL_STORAGE_ONLY?: string;
}

interface ImportMeta {
  readonly env: ImportMetaEnv;
}
