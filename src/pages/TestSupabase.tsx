import { useEffect, useState } from 'react';
import { supabase } from '../lib/supabaseClient';

export default function TestSupabase() {
  const [status, setStatus] = useState('⏳ teste Verbindung...');

  useEffect(() => {
    async function ping() {
      try {
        const { data, error } = await supabase.from('your_table').select('*').limit(1);
        if (error) throw error;
        setStatus('✅ Verbindung ok — Tabelle erreichbar.');
      } catch (err) {
        setStatus('⚠️ Fehler: ' + (err as Error).message);
      }
    }
    ping();
  }, []);

  return (
    <div style={{ padding: 24, fontFamily: 'system-ui, sans-serif' }}>
      <h2>Supabase Test</h2>
      <p>{status}</p>
    </div>
  );
}
