import 'node:process';

const ref  = process.env.VITE_PROJECT_REF || process.env.PROJECT_REF;
const anon = process.env.VITE_SB_ANON_KEY || process.env.SB_ANON_KEY;
if (!ref || !anon) { console.error('Missing env'); process.exit(1); }

const q = 'API'; // Suchbegriff
const u = new URL(`https://${ref}.supabase.co/rest/v1/feed_items_public`);
u.searchParams.set('select', '*');
u.searchParams.set('order', 'inserted_at.desc,id.desc');
u.searchParams.set('title', `ilike.*${q}*`);
u.searchParams.set('limit', '5');

const r = await fetch(u, { headers: { apikey: anon, Authorization: `Bearer ${anon}` } });
if (!r.ok) { console.error('HTTP', r.status, await r.text().catch(()=>'')); process.exit(2); }
const j = await r.json();
console.log('OK search len=', j.length);
console.log(JSON.stringify(j, null, 2));
