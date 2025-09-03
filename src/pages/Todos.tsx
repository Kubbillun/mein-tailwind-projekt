import { useEffect, useState } from 'react';
import { supabase } from '../lib/supabaseClient';

type Todo = {
  id: number;
  title: string;
  done: boolean;
  inserted_at: string;
};

export default function Todos() {
  const [todos, setTodos] = useState<Todo[] | null>(null);
  const [loading, setLoading] = useState(true);
  const [err, setErr] = useState<string | null>(null);
  const [newTitle, setNewTitle] = useState('');

  async function load() {
    try {
      setLoading(true);
      setErr(null);

      const { data, error } = await supabase
        .from('todos')
        .select('*')
        .order('inserted_at', { ascending: false });

      if (error) throw error;
      setTodos(data ?? []);
    } catch (e: any) {
      setErr(e?.message ?? String(e));
      setTodos(null);
    } finally {
      setLoading(false);
    }
  }

  async function addTodo(e: React.FormEvent) {
    e.preventDefault();
    if (!newTitle.trim()) return;

    try {
      const { error } = await supabase
        .from('todos')
        .insert({ title: newTitle.trim(), done: false });

      if (error) throw error;
      setNewTitle('');
      await load();
    } catch (e: any) {
      alert('Fehler beim Einfügen: ' + (e?.message ?? String(e)));
    }
  }

  useEffect(() => {
    load();
  }, []);

  return (
    <div style={{ padding: 24, fontFamily: 'system-ui, sans-serif' }}>
      <h2>Todos (Supabase)</h2>

      <form onSubmit={addTodo} style={{ marginBottom: 16 }}>
        <input
          value={newTitle}
          onChange={(e) => setNewTitle(e.target.value)}
          placeholder="Neues Todo…"
          style={{ padding: 6, marginRight: 8 }}
        />
        <button type="submit">Hinzufügen</button>
      </form>

      <div style={{ marginBottom: 12 }}>
        <button onClick={load} disabled={loading} style={{ padding: '6px 10px' }}>
          {loading ? 'Lade…' : 'Neu laden'}
        </button>
      </div>

      {err && <p style={{ color: '#b00020' }}>⚠️ Fehler: {err}</p>}
      {!err && loading && <p>⏳ Lade Daten…</p>}
      {!err && !loading && todos && todos.length === 0 && <p>Keine Todos vorhanden.</p>}

      {!err && !loading && todos && todos.length > 0 && (
        <ul>
          {todos.map(t => (
            <li key={t.id}>
              <span>{t.done ? '✅' : '⬜️'}</span>{' '}
              <strong>{t.title}</strong>{' '}
              <small style={{ color: '#666' }}>
                — {new Date(t.inserted_at).toLocaleString()}
              </small>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
