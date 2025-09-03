import 'dotenv/config';
import { createClient } from '@supabase/supabase-js';

const url = process.env.SUPABASE_URL;
const service = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!url || !service) {
    console.error('Fehlende ENV Variablen: SUPABASE_URL oder SUPABASE_SERVICE_ROLE_KEY');
    process.exit(1);
}

const supabase = createClient(url, service, { auth: { persistSession: false } });

try {
    const { data, error } = await supabase
        .from('tc_feed_items')
        .select('id, title, status, visible_from')
        .order('id', { ascending: false })
        .limit(3);

    if (error) throw error;
    console.table(data || []);
    process.exit(0);
} catch (e) {
    console.error('Supabase Fehler:', e);
    process.exit(2);
}