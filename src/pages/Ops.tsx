// src/pages/Ops.tsx
import { useEffect, useMemo, useState } from "react";
import { supabase } from "../utils/supabase/client";

type Row = {
    jobname: string;
    failures_24h: number | null;
    successes_24h: number | null;
    total_24h: number | null;
    failure_rate_24h: number | null;
    last_run_status: string | null;
    last_run_at_real: string | null;
    computed_status: "OK" | "WARN" | "FAIL" | "UNKNOWN";
};

const REFRESH_MS = 15000;

function fmtTime(iso: string | null) {
    return iso ? new Date(iso).toLocaleString() : "-";
}

export default function Ops() {
    const [data, setData] = useState<Row[] | null>(null);
    const [error, setError] = useState<string | null>(null);
    const [loading, setLoading] = useState(true);
    const [filter, setFilter] = useState("");
    const [lastFetch, setLastFetch] = useState<Date | null>(null);

    const [sortKey, setSortKey] = useState<keyof Row>("jobname");
    const [sortDir, setSortDir] = useState<"asc" | "desc">("asc");
    const [page, setPage] = useState(0);
    const rowsPerPage = 10;

    async function fetchData() {
        const { data, error } = await supabase.rpc("api_ops_home_v7");
        if (error) setError(error.message);
        else setData(data as Row[]);
        setLoading(false);
        setLastFetch(new Date());
    }

    useEffect(() => {
        fetchData();
        const id = setInterval(fetchData, REFRESH_MS);
        return () => clearInterval(id);
    }, []);

    const filtered = useMemo(
        () =>
            (data ?? []).filter((r) =>
                r.jobname.toLowerCase().includes(filter.toLowerCase())
            ),
        [data, filter]
    );

    const sorted = useMemo(() => {
        const arr = [...filtered];
        arr.sort((a, b) => {
            const va = (a[sortKey] ?? "") as any;
            const vb = (b[sortKey] ?? "") as any;
            const res =
                typeof va === "number" && typeof vb === "number"
                    ? va - vb
                    : String(va).localeCompare(String(vb));
            return sortDir === "asc" ? res : -res;
        });
        return arr;
    }, [filtered, sortKey, sortDir]);

    const pageCount = Math.max(1, Math.ceil(sorted.length / rowsPerPage));
    const pageRows = sorted.slice(page * rowsPerPage, (page + 1) * rowsPerPage);
    useEffect(() => setPage(0), [filter]);

    if (loading) return <div className="p-6">⏳ Lade Daten…</div>;
    if (error) return <div className="p-6 text-red-600">Fehler: {error}</div>;

    const badge = (status: Row["computed_status"]) => {
        const map: Record<Row["computed_status"], string> = {
            OK: "bg-green-100 text-green-800 border-green-300",
            WARN: "bg-yellow-100 text-yellow-800 border-yellow-300",
            FAIL: "bg-red-100 text-red-800 border-red-300",
            UNKNOWN: "bg-gray-100 text-gray-800 border-gray-300",
        };
        return (
            <span className={`px-2 py-1 text-xs rounded border font-semibold ${map[status]}`}>
                {status}
            </span>
        );
    };

    const Th = ({ k, label }: { k: keyof Row; label: string }) => {
        const active = k === sortKey;
        const dir = active ? (sortDir === "asc" ? "▲" : "▼") : "";
        return (
            <th
                className="p-3 border cursor-pointer select-none sticky top-0 bg-gray-100 z-10"
                onClick={() => {
                    if (k === sortKey) setSortDir((d) => (d === "asc" ? "desc" : "asc"));
                    else {
                        setSortKey(k);
                        setSortDir("asc");
                    }
                    setPage(0);
                }}
                title="zum Sortieren klicken"
            >
                {label} {dir}
            </th>
        );
    };

    const exportCSV = () => {
        if (!sorted.length) return;
        const headers = Object.keys(sorted[0]) as (keyof Row)[];
        const lines = [headers.join(",")];
        sorted.forEach((r) => {
            const row = headers
                .map((h) => `"${String((r as any)[h] ?? "").replace(/"/g, '""')}"`)
                .join(",");
            lines.push(row);
        });
        const blob = new Blob([lines.join("\n")], { type: "text/csv;charset=utf-8" });
        const url = URL.createObjectURL(blob);
        const a = document.createElement("a");
        a.href = url;
        a.download = `ops_v7_${new Date().toISOString().slice(0, 19)}.csv`;
        a.click();
        URL.revokeObjectURL(url);
    };

    return (
        <div className="p-6">
            <div className="flex items-center justify-between mb-4">
                <h1 className="text-2xl font-bold">⚙️ Ops Status</h1>
                <div className="flex items-center gap-3 text-xs text-gray-600">
                    <span>Auto-Refresh: {Math.round(REFRESH_MS / 1000)}s</span>
                    <span>{lastFetch ? `• Zuletzt: ${lastFetch.toLocaleTimeString()}` : ""}</span>
                    <button onClick={fetchData} className="px-2 py-1 border rounded">
                        Neu laden
                    </button>
                    <button onClick={exportCSV} className="px-2 py-1 border rounded">
                        CSV exportieren
                    </button>
                </div>
            </div>

            <div className="mb-4">
                <label className="block text-sm font-medium mb-1">🔍 Nach Jobname filtern:</label>
                <input
                    type="text"
                    placeholder="z. B. refresh"
                    value={filter}
                    onChange={(e) => setFilter(e.target.value)}
                    className="border rounded px-3 py-2 w-full max-w-sm"
                />
            </div>

            <div className="overflow-x-auto shadow border rounded-lg">
                <table className="min-w-full text-sm text-left border-collapse">
                    <thead className="bg-gray-100">
                        <tr>
                            <Th k="jobname" label="jobname" />
                            <Th k="computed_status" label="status" />
                            <Th k="last_run_at_real" label="last_run_at" />
                            <Th k="last_run_status" label="last_run_status" />
                            <Th k="failures_24h" label="failures_24h" />
                            <Th k="successes_24h" label="successes_24h" />
                            <Th k="total_24h" label="total_24h" />
                            <Th k="failure_rate_24h" label="failure_rate_24h" />
                        </tr>
                    </thead>
                    <tbody>
                        {pageRows.length === 0 ? (
                            <tr>
                                <td className="p-6 text-center text-gray-500" colSpan={8}>
                                    Keine Einträge. Filter zurücksetzen oder Datenquelle prüfen.
                                </td>
                            </tr>
                        ) : (
                            pageRows.map((r, i) => (
                                <tr
                                    key={r.jobname}
                                    className={
                                        r.computed_status === "FAIL"
                                            ? "bg-red-50"
                                            : r.computed_status === "WARN"
                                                ? "bg-yellow-50"
                                                : i % 2 === 0
                                                    ? "bg-white"
                                                    : "bg-gray-50"
                                    }
                                >
                                    <td className="p-3 border font-mono">{r.jobname}</td>
                                    <td className="p-3 border">{badge(r.computed_status)}</td>
                                    <td className="p-3 border">{fmtTime(r.last_run_at_real)}</td>
                                    <td className="p-3 border">{r.last_run_status ?? "-"}</td>
                                    <td className="p-3 border text-center">{r.failures_24h ?? "-"}</td>
                                    <td className="p-3 border text-center">{r.successes_24h ?? "-"}</td>
                                    <td className="p-3 border text-center">{r.total_24h ?? "-"}</td>
                                    <td className="p-3 border text-center">
                                        {r.failure_rate_24h != null ? r.failure_rate_24h.toFixed(2) : "-"}
                                    </td>
                                </tr>
                            ))
                        )}
                    </tbody>
                </table>
            </div>

            <div className="mt-3 flex items-center gap-3">
                <button
                    onClick={() => setPage((p) => Math.max(0, p - 1))}
                    disabled={page === 0}
                    className="px-3 py-1 border rounded disabled:opacity-50"
                >
                    ← Zurück
                </button>
                <span className="text-sm">
                    Seite {page + 1} von {pageCount}
                </span>
                <button
                    onClick={() => setPage((p) => Math.min(pageCount - 1, p + 1))}
                    disabled={page >= pageCount - 1}
                    className="px-3 py-1 border rounded disabled:opacity-50"
                >
                    Weiter →
                </button>
            </div>
        </div>
    );
}