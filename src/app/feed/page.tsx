// src/app/feed/page.tsx
import { useEffect, useMemo, useState } from 'react'
import { fetchFeedPage, type FeedOrder, type FeedParams } from '../../lib/feedApi'

type Row = {
  id: number
  title: string | null
  price: number | null
  currency: string | null
  url: string | null
  inserted_at: string
}

export default function FeedPage() {
  // --- UI state ---
  const [q, setQ] = useState<string>('')
  const [order, setOrder] = useState<FeedOrder>('newest')
  const [min, setMin] = useState<string>('') // keep as string for input
  const [max, setMax] = useState<string>('')
  const [limit, setLimit] = useState<number>(10)

  // --- data state (always default to []) ---
  const [items, setItems] = useState<Row[]>([])
  const [lastTs, setLastTs] = useState<string | null>(null)
  const [lastId, setLastId] = useState<number | null>(null)
  const [loading, setLoading] = useState(false)
  const [err, setErr] = useState<string | null>(null)
  const [allLoaded, setAllLoaded] = useState(false)

  const params: FeedParams = useMemo(() => {
    return {
      q: q.trim() || undefined,
      order,
      min: min !== '' ? Number(min) : undefined,
      max: max !== '' ? Number(max) : undefined,
      limit,
      lastTs,
      lastId,
    }
  }, [q, order, min, max, limit, lastTs, lastId])

  async function loadFirst() {
    setLoading(true)
    setErr(null)
    setAllLoaded(false)
    setLastTs(null)
    setLastId(null)
    try {
      const page = await fetchFeedPage({ ...params, lastTs: null, lastId: null })
      const safe = Array.isArray(page) ? (page as Row[]) : []
      setItems(safe)
      if (safe.length > 0) {
        const last = safe[safe.length - 1]
        setLastTs(last.inserted_at)
        setLastId(last.id)
        setAllLoaded(false)
      } else {
        setAllLoaded(true)
      }
    } catch (e: any) {
      setErr(e?.message ?? String(e))
      setItems([]) // defensive
    } finally {
      setLoading(false)
    }
  }

  async function loadMore() {
    if (allLoaded || loading) return
    setLoading(true)
    setErr(null)
    try {
      const page = await fetchFeedPage(params)
      const safe = Array.isArray(page) ? (page as Row[]) : []
      setItems(prev => [...prev, ...safe])
      if (safe.length > 0) {
        const last = safe[safe.length - 1]
        setLastTs(last.inserted_at)
        setLastId(last.id)
      } else {
        setAllLoaded(true)
      }
    } catch (e: any) {
      setErr(e?.message ?? String(e))
    } finally {
      setLoading(false)
    }
  }

  // initial load + whenever filter/sort/limit changes
  useEffect(() => {
    void loadFirst()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [q, order, min, max, limit])

  const list: Row[] = Array.isArray(items) ? items : []

  return (
    <main className="mx-auto max-w-4xl p-6 space-y-4">
      <h1 className="text-3xl font-bold">Latest Feed Items</h1>

      {/* Controls */}
      <div className="flex flex-wrap gap-2 items-center">
        <input
          value={q}
          onChange={(e) => setQ(e.target.value)}
          placeholder="Titel suchen..."
          className="border px-3 py-2 rounded w-64"
        />
        <select
          value={order}
          onChange={(e) => setOrder(e.target.value as FeedOrder)}
          className="border px-3 py-2 rounded"
        >
          <option value="newest">Neueste zuerst</option>
          <option value="oldest">Älteste zuerst</option>
          <option value="price_desc">Preis ↓</option>
          <option value="price_asc">Preis ↑</option>
        </select>
        <input
          value={min}
          onChange={(e) => setMin(e.target.value)}
          placeholder="Min €"
          inputMode="numeric"
          className="border px-3 py-2 rounded w-28"
        />
        <input
          value={max}
          onChange={(e) => setMax(e.target.value)}
          placeholder="Max €"
          inputMode="numeric"
          className="border px-3 py-2 rounded w-28"
        />
        <select
          value={limit}
          onChange={(e) => setLimit(Number(e.target.value))}
          className="border px-3 py-2 rounded"
        >
          <option value={5}>5 / Seite</option>
          <option value={10}>10 / Seite</option>
          <option value={20}>20 / Seite</option>
        </select>
      </div>

      {/* Error / Status */}
      {err && (
        <div className="text-red-700 font-semibold">
          Fehler: {err}
        </div>
      )}

      {/* List */}
      <ul className="space-y-3">
        {list.length === 0 && !loading && !err && <li>• Keine Treffer.</li>}
        {list.map((it) => (
          <li key={it.id} className="border rounded p-3">
            <div className="flex items-baseline justify-between gap-3">
              <a
                href={it.url ?? '#'}
                target="_blank"
                rel="noreferrer"
                className="underline underline-offset-2"
              >
                {it.title || 'Untitled'}
              </a>
              <span className="text-sm text-gray-500">
                {new Date(it.inserted_at).toLocaleString()}
              </span>
            </div>
            <div className="text-sm text-gray-700 mt-1">
              {it.price != null ? `${it.price} ${it.currency ?? ''}` : '—'}
            </div>
            {it.url && (
              <div className="mt-1">
                <code className="rounded bg-gray-100 px-2 py-1 text-xs">{it.url}</code>
              </div>
            )}
          </li>
        ))}
      </ul>

      {/* Pager */}
      <div className="pt-2">
        <button
          onClick={loadMore}
          disabled={loading || allLoaded}
          className="border px-4 py-2 rounded disabled:opacity-60"
        >
          {allLoaded ? 'Alles geladen' : loading ? 'Laden…' : 'Mehr laden'}
        </button>
      </div>
    </main>
  )
}