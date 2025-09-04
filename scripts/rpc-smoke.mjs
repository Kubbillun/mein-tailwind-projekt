import 'dotenv/config';
import { createClient } from '@supabase/supabase-js';

const url = process.env.SUPABASE_URL;
const key = process.env.SUPABASE_SERVICE_ROLE_KEY; // nur server!
const sb = createClient(url, key, { auth: { persistSession: false } });

const payload = {
    _title: 'RPC Smoke',
    _body: 'Minimaler Test',
    _source: 'api',
    _visible_from: new Date().toISOString(), // passt für timestamptz
};

const { data, error } = await sb.rpc('create_and_approve_feed_item', payload);
if (error) {
    console.error('❌ RPC-Fehler:', error);
    process.exit(1);
}
console.log('✅ RPC ok:', data);