// ~/Projects/quickstart-crew/src/pages/Feed.tsx
import { useEffect, useMemo, useState } from 'react';
import { getClientEnv, exposeEnvForDebug } from '../lib/clientEnv';

type Item = {
  id: number;
  title: string | null;
  price: number | null;
  currency: string | null;
  url: string | null;
  inserted_at: string;
};

export default function Feed() {
  // Env einheitlich beziehen
  const { ref, anon, viteEnv } = getClientEnv();

  // Debug nur in DEV
  if ((viteEnv as any)?.DEV) {
    // eslint-disable-next-line no-console
    console.info('[ENV] via clientEnv', { ref, HAS_KEY: !!anon });
    exposeEnvForDebug();
  }

  const [err, setErr] = useState<string | null>(null);
  const [items, setItems] = useState<Item[]>([]);
  const [limit] = useState(10);

  const baseUrl = useMemo(() => {
    if (!ref || !anon) return null;
    const u = new URL(`https://${ref}.supabase.co/rest/v1/feed_items_public`);
    u.searchParams.set('select', '*');
    u.searchParams.set('order', 'inserted_at.desc,id.desc');
    return u;
  }, [ref, anon]);

  useEffect(() => {
    if (!ref || !anon) {
      setErr('Missing VITE_PROJECT_REF / VITE_SB_ANON_KEY');
      return;
    }
    (async () => {
      try {
        const u = new URL(baseUrl!.toString());
        u.searchParams.set('limit', String(limit));
        const r = await fetch(u, {
          headers: { apikey: anon, Authorization: `Bearer ${anon}`, Accept: 'application/json' },
        });
        if (!r.ok) throw new Error(`HTTP ${r.status} ${await r.text().catch(() => '')}`);
        setItems(await r.json());
        setErr(null);
      } catch (e: any) {
        setErr(e?.message ?? String(e));
        setItems([]); // defensiv
      }
    })();
  }, [baseUrl, ref, anon, limit]);

  return (
    <main style={{ padding: 16 }}>
      <h1>Latest Feed Items</h1>

      {/* Debug-Panel: zeigt live, was der Client sieht */}
      {(viteEnv as any)?.DEV && (
        <div style={{ padding: 12, border: '1px solid #ddd', borderRadius: 8, marginBottom: 16 }}>
          <strong>Debug:</strong>
          <div>VITE_PROJECT_REF: <code>{ref ?? '∅'}</code></div>
          <div>VITE_SB_ANON_KEY gesetzt?: <code>{anon ? 'ja' : 'nein'}</code></div>
        </div>
      )}

      {err && (
        <p>
          <strong>Fehler:</strong> {err}
        </p>
      )}

      <ul>
        {items.map(it => (
          <li key={it.id}>
            <a href={it.url ?? '#'} target="_blank" rel="noreferrer">
              {it.title ?? 'Untitled'}
            </a>{' '}
            — {it.price ?? '—'} {it.currency ?? ''}
          </li>
        ))}
      </ul>
    </main>
  );
}