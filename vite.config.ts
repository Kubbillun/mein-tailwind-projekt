// vite.config.ts
import { defineConfig, loadEnv } from 'vite'
import react from '@vitejs/plugin-react'

export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, process.cwd(), '')

  // explizit nur unsere beiden Variablen durchreichen
  const VITE_PROJECT_REF = env.VITE_PROJECT_REF ?? ''
  const VITE_SB_ANON_KEY = env.VITE_SB_ANON_KEY ?? ''

  return {
    plugins: [react()],
    envPrefix: ['VITE_'],
    define: {
      'process.env': {}, // verhindert alte Fallbacks
      'import.meta.env.VITE_PROJECT_REF': JSON.stringify(VITE_PROJECT_REF),
      'import.meta.env.VITE_SB_ANON_KEY': JSON.stringify(VITE_SB_ANON_KEY),
    }
  }
})