import { createClient } from '@supabase/supabase-js';

const url = import.meta.env.VITE_SUPABASE_URL as string;
const anon = import.meta.env.VITE_SUPABASE_ANON_KEY as string;

if (!url || !anon) {
    // sichtbarer Hinweis im Browser und in der Konsole
    const msg = 'Supabase ENV fehlt: VITE_SUPABASE_URL oder VITE_SUPABASE_ANON_KEY';
    console.error(msg);
    throw new Error(msg);
}

export const supabase = createClient(url, anon, {
    auth: { persistSession: false }
});