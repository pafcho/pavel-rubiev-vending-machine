/// <reference types="vite/client" />

interface ImportMetaEnv {
  /** Set to `'true'` to make the mocked products API reject, exercising the error UI. */
  readonly VITE_SIMULATE_API_FAILURE?: string
}

interface ImportMeta {
  readonly env: ImportMetaEnv
}
