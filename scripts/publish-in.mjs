import 'dotenv/config';
import { createClient } from '@supabase/supabase-js';

const supabase = createClient(process.env.SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY);

const minutes = 10; // anpassen
const { data, error } = await supabase.rpc('create_and_approve_feed_item', {
    _title: `API +${minutes}min`,
    _body: 'Sichtbar später',
    _source: 'app',
    _visible_from: new Date(Date.now() + minutes * 60 * 1000).toISOString()
});

if (error) {
    console.error('❌ Fehler:', error);
    process.exit(1);
}

console.log(`✅ Feed-Item geplant in ${minutes}min:`, data);