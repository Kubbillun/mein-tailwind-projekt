import { createClient } from '@supabase/supabase-js';

const url  = import.meta.env.VITE_SUPABASE_URL as string;
const anon = import.meta.env.VITE_SUPABASE_ANON_KEY as string;

if (!url || !anon) {
  throw new Error('Supabase ENV fehlt: VITE_SUPABASE_URL oder VITE_SUPABASE_ANON_KEY.');
}

export const supabase = createClient(url, anon, {
  auth: { persistSession: false },
});

/** Pingt den Auth-Health-Endpoint – benötigt keine Tabellen/Policies. */
export async function pingAuth(): Promise<{ ok: boolean; status: number; text: string }> {
  const res = await fetch(`${url}/auth/v1/health`, {
    headers: {
      apikey: anon,
      Authorization: `Bearer ${anon}`,
    },
  });
  return { ok: res.ok, status: res.status, text: await res.text() };
}
