import 'dotenv/config';
import { createClient } from '@supabase/supabase-js';

const url = process.env.SUPABASE_URL;
const key = process.env.SUPABASE_SERVICE_ROLE_KEY; // NUR Server!
const supabase = createClient(url, key, { auth: { persistSession: false } });

const payload = {
    _title: 'API Now',
    _body: 'Dieser Post wurde per Script erstellt.',
    _source: 'api',
    _visible_from: new Date().toISOString(), // timestamptz
};

const { data, error } = await supabase.rpc('create_and_approve_feed_item', payload);
if (error) {
    console.error('❌ Fehler:', error);
    process.exit(1);
}
console.log('✅ Publish Now ok:', data);