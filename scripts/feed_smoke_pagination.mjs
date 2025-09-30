import 'node:process';

const ref  = process.env.VITE_PROJECT_REF || process.env.PROJECT_REF;
const anon = process.env.VITE_SB_ANON_KEY || process.env.SB_ANON_KEY;
if (!ref || !anon) { console.error('Missing env'); process.exit(1); }

const base = `https://${ref}.supabase.co/rest/v1/feed_items_public`;
const hdrs = { apikey: anon, Authorization: `Bearer ${anon}` };

// page 1
const first = new URL(base);
first.searchParams.set('select', '*');
first.searchParams.set('order', 'inserted_at.desc,id.desc');
first.searchParams.set('limit', '3');

let r = await fetch(first, { headers: hdrs });
if (!r.ok) { console.error('HTTP first', r.status, await r.text().catch(()=>'')); process.exit(2); }
const p1 = await r.json();
console.log('OK page1 len=', p1.length);

// page 2 (no manual encode, URLSearchParams will encode once)
if (p1.length > 0) {
  const last = p1[p1.length - 1];
  const next = new URL(base);
  next.searchParams.set('select', '*');
  next.searchParams.set('order', 'inserted_at.desc,id.desc');
  next.searchParams.set('limit', '3');
  next.searchParams.set('and', `(inserted_at.lt.${last.inserted_at},id.lt.${last.id})`);

  r = await fetch(next, { headers: hdrs });
  if (!r.ok) { console.error('HTTP next', r.status, await r.text().catch(()=>'')); process.exit(3); }
  const p2 = await r.json();
  console.log('OK page2 len=', p2.length);
  console.log(JSON.stringify({ page1_ids: p1.map(x=>x.id), page2_ids: p2.map(x=>x.id) }, null, 2));
}