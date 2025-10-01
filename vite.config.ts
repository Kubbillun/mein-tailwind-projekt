// vite.config.ts
import { defineConfig, loadEnv } from 'vite'
import react from '@vitejs/plugin-react'

export default defineConfig(({ mode }) => {
  // Lädt .env / .env.local etc.; ohne Prefix -> wir bekommen alles und filtern selbst
  const env = loadEnv(mode, process.cwd(), '')

  const VITE_PROJECT_REF = env.VITE_PROJECT_REF ?? ''
  const VITE_SB_ANON_KEY = env.VITE_SB_ANON_KEY ?? ''

  return {
    plugins: [react()],
    define: {
      // 1) klassisch: lässt Ausdrücke wie import.meta.env.VITE_* inline-replacen
      'import.meta.env.VITE_PROJECT_REF': JSON.stringify(VITE_PROJECT_REF),
      'import.meta.env.VITE_SB_ANON_KEY': JSON.stringify(VITE_SB_ANON_KEY),

      // 2) zusätzlich: eigene konstante Namen als absolut zuverlässige Fallbacks
      __VITE_PROJECT_REF__: JSON.stringify(VITE_PROJECT_REF),
      __VITE_SB_ANON_KEY__: JSON.stringify(VITE_SB_ANON_KEY),
    },
  }
})