import { useEffect, useState } from 'react';
import { supabase } from '../lib/supabaseClient';

type FeedItem = {
  id: number;
  source_id: number;
  external_id: string;
  title: string | null;
  price: number | null;
  currency: string;
  url: string | null;
  meta: Record<string, any>;
  inserted_at: string; // ISO-String
};

export default function FeedItems() {
  const [items, setItems] = useState<FeedItem[]>([]);
  const [loading, setLoading] = useState(false);
  const [err, setErr] = useState<string | null>(null);

  async function load() {
    setLoading(true);
    setErr(null);
    const { data, error } = await supabase
      .from('feed_items')
      .select('*')
      .order('inserted_at', { ascending: false })
      .limit(50);

    if (error) setErr(error.message);
    else setItems(data ?? []);
    setLoading(false);
  }

  useEffect(() => {
    load();
  }, []);

  return (
    <div style={{ padding: 24, fontFamily: 'system-ui, sans-serif' }}>
      <h2>Feed Items (Supabase)</h2>

      <div style={{ marginBottom: 12 }}>
        <button onClick={load} disabled={loading} style={{ padding: '6px 10px' }}>
          {loading ? 'Lade…' : 'Neu laden'}
        </button>
      </div>

      {err && <p style={{ color: '#b00020' }}>⚠️ Fehler: {err}</p>}
      {!err && loading && <p>⏳ Lade Daten…</p>}
      {!err && !loading && items.length === 0 && <p>Keine Items vorhanden.</p>}

      {!err && !loading && items.length > 0 && (
        <ul style={{ lineHeight: 1.6 }}>
          {items.map((it) => (
            <li key={it.id} style={{ margin: '10px 0' }}>
              <div>
                <strong>{it.title ?? '(ohne Titel)'}</strong>{' '}
                <small style={{ color: '#666' }}>
                  — {new Date(it.inserted_at).toLocaleString()}
                </small>
              </div>
              <div>
                💵 {it.price ?? '–'} {it.currency ?? ''}
                {' · '}
                🔗{' '}
                {it.url ? (
                  <a href={it.url} target="_blank" rel="noreferrer">
                    Link
                  </a>
                ) : (
                  'kein Link'
                )}
              </div>
              {it.meta && Object.keys(it.meta).length > 0 && (
                <pre
                  style={{
                    background: '#f6f6f6',
                    padding: 8,
                    borderRadius: 8,
                    overflowX: 'auto',
                    maxWidth: 640,
                  }}
                >
                  {JSON.stringify(it.meta, null, 2)}
                </pre>
              )}
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
