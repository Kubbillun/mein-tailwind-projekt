import 'node:process';
const ref  = process.env.VITE_PROJECT_REF || process.env.PROJECT_REF;
const anon = process.env.VITE_SB_ANON_KEY || process.env.SB_ANON_KEY;
if (!ref || !anon) {
  console.error('Missing VITE_PROJECT_REF/PROJECT_REF or VITE_SB_ANON_KEY/SB_ANON_KEY');
  process.exit(1);
}
const url = `https://${ref}.supabase.co/rest/v1/feed_items_public?select=*&order=inserted_at.desc,id.desc&limit=5`;
const res = await fetch(url, { headers: { apikey: anon, Authorization: `Bearer ${anon}` } });
if (!res.ok) {
  console.error('HTTP', res.status, res.statusText, await res.text().catch(()=>'')); process.exit(2);
}
const data = await res.json();
console.log('OK items=', data.length);
console.log(JSON.stringify(data, null, 2));
