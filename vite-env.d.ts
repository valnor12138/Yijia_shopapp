/// <reference types="vite/client" />

interface ImportMetaEnv {
  readonly VITE_COZE_BOT_ID: string
  readonly VITE_COZE_TOKEN: string
  readonly GEMINI_API_KEY?: string
}

interface ImportMeta {
  readonly env: ImportMetaEnv
}
