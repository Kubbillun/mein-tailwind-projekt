// src/lib/supabaseClient.ts
import { createClient } from '@supabase/supabase-js'

const ref =
  (typeof process !== 'undefined' && process.env.PROJECT_REF) ||
  (typeof import.meta !== 'undefined' && (import.meta as any).env?.VITE_PROJECT_REF)
const anon =
  (typeof process !== 'undefined' && process.env.SB_ANON_KEY) ||
  (typeof import.meta !== 'undefined' && (import.meta as any).env?.VITE_SB_ANON_KEY)

if (!ref || !anon) {
  throw new Error(
    'Missing Supabase env variables: PROJECT_REF / SB_ANON_KEY or VITE_PROJECT_REF / VITE_SB_ANON_KEY'
  )
}

export const supabase = createClient(`https://${ref}.supabase.co`, anon)

// --- health ping for build/health page ---
export async function pingAuth(): Promise<boolean> {
  // Works in Vite (browser) and in Node
  // Vite: import.meta.env.VITE_*
  // Node: process.env.*
  // @ts-ignore
  const viteEnv = (typeof import.meta !== 'undefined' && (import.meta as any).env) || {}
  const ref =
    viteEnv.VITE_PROJECT_REF ?? (typeof process !== 'undefined' ? process.env.PROJECT_REF : undefined)
  const anon =
    viteEnv.VITE_SB_ANON_KEY ?? (typeof process !== 'undefined' ? process.env.SB_ANON_KEY : undefined)

  if (!ref || !anon) return false

  const res = await fetch(`https://${ref}.supabase.co/rest/v1/?select=1`, {
    headers: { apikey: anon, Authorization: `Bearer ${anon}` },
  })
  return res.ok
}