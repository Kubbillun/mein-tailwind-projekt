import 'dotenv/config';
import { createClient } from '@supabase/supabase-js';

const supabase = createClient(process.env.SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY);

const minutes = 15; // anpassen
const { data, error } = await supabase.rpc('create_and_approve_feed_item', {
    _title: `API Backfill -${minutes}min`,
    _body: 'Rückwirkend sichtbar',
    _source: 'app',
    _visible_from: new Date(Date.now() - minutes * 60 * 1000).toISOString()
});

if (error) {
    console.error('❌ Fehler:', error);
    process.exit(1);
}

console.log(`✅ Feed-Item rückdatiert um ${minutes}min:`, data);