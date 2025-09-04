// src/pages/Market.tsx
import { useEffect, useMemo, useState } from "react";
import { supabase } from "../lib/supabase";

type Row = Record<string, any>;

export default function Market() {
    const [rows, setRows] = useState<Row[]>([]);
    const [count, setCount] = useState<number | null>(null);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);

    // UI-Filter / Pagination
    const [q, setQ] = useState("");
    const [page, setPage] = useState(0);
    const limit = 25;
    const offset = page * limit;

    const canPrev = page > 0;
    const canNext = useMemo(() => {
        if (count == null) return true;
        return offset + limit < count;
    }, [count, offset, limit]);

    async function load() {
        setLoading(true);
        setError(null);
        try {
            // ---- READ-ONLY VIEW ----
            let query = supabase
                .from("mv_card_market")
                .select("*", { count: "exact" })
                .range(offset, offset + limit - 1);

            // Optionale Suche (hier Beispiel auf source_id — anpassen, falls du eine Name-Spalte hast)
            if (q.trim()) {
                // @ts-ignore (ilike ist nicht in allen Typings)
                query = (query as any).ilike?.("source_id", `%${q.trim()}%`) ?? query;
            }

            // Sortierung: wenn die View sold_at hat, sortieren; sonst ohne order fahren
            let resp:
                | { data: Row[] | null; error: any; count: number | null }
                | undefined;

            if ("order" in (query as any)) {
                // @ts-ignore
                resp = await (query as any).order?.("sold_at", { ascending: false }) ?? (await query);
            } else {
                resp = await query as any;
            }

            const { data, error, count } = resp!;
            if (error) throw error;
            setRows(data ?? []);
            setCount(count ?? null);
        } catch (e: any) {
            console.error("❌ Load error:", e);
            setError(e?.message ?? "Unbekannter Fehler");
            setRows([]);
            setCount(0);
        } finally {
            setLoading(false);
        }
    }

    useEffect(() => {
        load();
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [q, page]);

    const columns = useMemo(() => (rows[0] ? Object.keys(rows[0]) : []), [rows]);

    return (
        <div style={{ padding: "2rem" }}>
            <h1 style={{ fontWeight: 700, fontSize: "1.6rem", marginBottom: 12 }}>
                Market (read-only, via <code>mv_card_market</code>)
            </h1>

            {/* Suche */}
            <div style={{ display: "flex", gap: 8, marginBottom: 12 }}>
                <input
                    value={q}
                    onChange={(e) => {
                        setPage(0);
                        setQ(e.target.value);
                    }}
                    placeholder="Suche (source_id)…"
                    style={{
                        padding: 8,
                        border: "1px solid #ddd",
                        borderRadius: 8,
                        flex: 1,
                    }}
                />
                <button
                    onClick={() => {
                        setPage(0);
                        load();
                    }}
                    disabled={loading}
                    style={{
                        padding: "8px 12px",
                        borderRadius: 8,
                        border: "1px solid #ddd",
                        background: "#f5f5f5",
                    }}
                >
                    Suchen
                </button>
            </div>

            {/* Pagination */}
            <div style={{ display: "flex", gap: 8, alignItems: "center", marginBottom: 10 }}>
                <button onClick={() => setPage((p) => Math.max(0, p - 1))} disabled={!canPrev || loading}>
                    ← Zurück
                </button>
                <div>
                    Seite {page + 1}
                    {count != null ? ` / ~${Math.max(1, Math.ceil(count / limit))}` : ""}
                </div>
                <button
                    onClick={() => canNext && setPage((p) => p + 1)}
                    disabled={!canNext || loading}
                >
                    Weiter →
                </button>
                <div style={{ marginLeft: "auto", opacity: 0.7 }}>
                    {loading ? "Lädt…" : `${rows.length} Einträge`}
                    {count != null ? ` (gesamt ${count})` : ""}
                </div>
            </div>

            {/* Fehleranzeige */}
            {error && <div style={{ color: "#b00020", marginBottom: 10 }}>Fehler: {error}</div>}

            {/* Tabelle */}
            <div style={{ overflowX: "auto", border: "1px solid #eee", borderRadius: 8 }}>
                <table style={{ minWidth: 900, width: "100%", borderCollapse: "collapse" }}>
                    <thead>
                        <tr>
                            {columns.length > 0 ? (
                                columns.map((k) => (
                                    <th
                                        key={k}
                                        style={{
                                            textAlign: "left",
                                            padding: 8,
                                            borderBottom: "1px solid #eee",
                                            fontWeight: 600,
                                            whiteSpace: "nowrap",
                                        }}
                                    >
                                        {k}
                                    </th>
                                ))
                            ) : (
                                <th style={{ textAlign: "left", padding: 8 }}>Keine Daten</th>
                            )}
                        </tr>
                    </thead>
                    <tbody>
                        {rows.map((r, i) => (
                            <tr key={i} style={{ borderTop: "1px solid #f2f2f2" }}>
                                {columns.map((k) => (
                                    <td key={k} style={{ padding: 8, whiteSpace: "nowrap" }}>
                                        {String(r[k] ?? "")}
                                    </td>
                                ))}
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>
        </div>
    );
}