import { useEffect, useState } from "react";
import { supabase } from "../lib/supabaseClient";

/**
 * Minimaler Verbindungs-Check:
 * - Versucht, aus einer existierenden Tabelle/View zu lesen (z.B. "series" oder "v_series").
 * - Wenn deine DB anders heißt, kannst du unten "series" zu einer vorhandenen Tabelle ändern.
 * - Falls keine Leserechte bestehen, zeigen wir die Supabase-Fehlermeldung transparent an.
 */
export default function SbPing() {
  const [status, setStatus] = useState<"idle" | "ok" | "warn" | "error">("idle");
  const [message, setMessage] = useState<string>("Starte Ping …");

  useEffect(() => {
    (async () => {
      try {
        // 1) Prüfe, ob ENV korrekt geladen ist
        const url = import.meta.env.VITE_SUPABASE_URL;
        const anon = import.meta.env.VITE_SUPABASE_ANON_KEY;
        if (!url || !anon) {
          setStatus("error");
          setMessage("ENV fehlt: VITE_SUPABASE_URL oder VITE_SUPABASE_ANON_KEY ist leer.");
          return;
        }

        // 2) Sehr sanfter Read: wir versuchen, 0 Zeilen zu lesen – nur um Rechte/Existenz zu testen
        //    Passen: "series" → ggf. auf eine bei dir sicher vorhandene Tabelle/View ändern (z.B. "v_series").
        const { error, count } = await supabase
          .from("series")
          .select("*", { count: "estimated", head: true })
          .limit(1);

        if (error) {
          // Rechte / Tabelle / RLS: alles wird hier sichtbar
          setStatus("warn");
          setMessage(`Verbindung ok, aber Query warnte/fehlschlug: ${error.message}`);
          return;
        }

        setStatus("ok");
        setMessage(`Verbindung ok ✅ – Tabelle "series" erreichbar (count≈${count ?? "?"}).`);
      } catch (err: any) {
        setStatus("error");
        setMessage(`Unerwarteter Fehler: ${err?.message ?? String(err)}`);
      }
    })();
  }, []);

  const color =
    status === "ok" ? "#16a34a" : status === "warn" ? "#f59e0b" : status === "error" ? "#dc2626" : "#0ea5e9";

  return (
    <div style={{ padding: 24, fontFamily: "system-ui, sans-serif" }}>
      <h1>Supabase Test</h1>
      <p style={{ color, whiteSpace: "pre-wrap" }}>{message}</p>
      <div style={{ marginTop: 12, fontSize: 14, color: "#6b7280" }}>
        URL: <code>{import.meta.env.VITE_SUPABASE_URL || "—"}</code>
      </div>
    </div>
  );
}
