// src/utils/supabase/client.ts
import { createClient } from "@supabase/supabase-js";

const url = import.meta.env.VITE_SUPABASE_URL as string;
const key = import.meta.env.VITE_SUPABASE_ANON_KEY as string;

if (!url || !key) {
    throw new Error("ENV fehlt: VITE_SUPABASE_URL und VITE_SUPABASE_ANON_KEY");
}

export const supabase = createClient(url, key);