import React, { useEffect, useState } from 'react';
import { supabase } from './lib/supabase';

type FeedRow = {
  id: number;
  title: string;
  status: 'approved' | 'draft';
  visible_from: string; // timestamptz
  created_at: string;
};

export default function App() {
  const [rows, setRows] = useState<FeedRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    (async () => {
      setLoading(true);
      setError(null);

      // Öffentliche Sicht (ohne Auth): v_feed_public
      const { data, error } = await supabase
        .from('v_feed_public')
        .select('id, title, status, visible_from, created_at')
        .order('visible_from', { ascending: false })
        .limit(20);

      if (error) {
        console.error(error);
        setError(error.message);
      } else {
        setRows((data ?? []) as FeedRow[]);
      }
      setLoading(false);
    })();
  }, []);

  return (
    <div style={{ fontFamily: 'system-ui, sans-serif', padding: 24, maxWidth: 800, margin: '0 auto' }}>
      <h1>Öffentlicher Feed</h1>
      <p style={{ color: '#555' }}>Quelle: <code>v_feed_public</code></p>

      {loading && <p>Lade…</p>}
      {error && <p style={{ color: 'crimson' }}>Fehler: {error}</p>}

      {!loading && !error && rows.length === 0 && <p>Keine Einträge sichtbar.</p>}

      <ul style={{ listStyle: 'none', padding: 0, margin: 0 }}>
        {rows.map(r => (
          <li key={r.id} style={{ padding: '12px 0', borderBottom: '1px solid #eee' }}>
            <div style={{ fontSize: 16, fontWeight: 600 }}>{r.title}</div>
            <div style={{ fontSize: 12, color: '#666' }}>
              {r.status} • sichtbar ab {new Date(r.visible_from).toLocaleString()}
            </div>
          </li>
        ))}
      </ul>
    </div>
  );
}