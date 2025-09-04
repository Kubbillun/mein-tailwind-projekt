import { createClient } from '@supabase/supabase-js';

const url = import.meta.env.VITE_SUPABASE_URL as string | undefined;
const anon = import.meta.env.VITE_SUPABASE_ANON_KEY as string | undefined;

if (!url || !anon) {
    // nur Laufzeit-Check – bricht den **Build** nicht
    throw new Error('Supabase ENV fehlt: VITE_SUPABASE_URL oder VITE_SUPABASE_ANON_KEY');
}

export const supabase = createClient(url, anon, {
    auth: { persistSession: false }
});