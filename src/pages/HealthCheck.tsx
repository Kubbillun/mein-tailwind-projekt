import { useEffect, useState } from 'react';
import { pingAuth } from '../lib/supabaseClient';

export default function HealthCheck() {
  const [msg, setMsg] = useState('⏳ prüfe Auth-Health…');

  useEffect(() => {
    (async () => {
      try {
        const r = await pingAuth();
        setMsg(r.ok
          ? `✅ Auth-Health ok (status ${r.status})`
          : `⚠️ Auth-Health NOK (status ${r.status}) – ${r.text}`);
      } catch (e: any) {
        setMsg('⚠️ Fehler: ' + (e?.message ?? String(e)));
      }
    })();
  }, []);

  return (
    <div style={{ padding: 24, fontFamily: 'system-ui, sans-serif' }}>
      <h2>Supabase Auth-Health</h2>
      <p>{msg}</p>
    </div>
  );
}
