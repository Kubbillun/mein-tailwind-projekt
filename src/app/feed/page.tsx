import { useEffect, useMemo, useState } from 'react'
import { getClientEnv } from '../../lib/clientEnv'
import type { Row, Order } from './feedTypes'
import { fetchJson, supabaseHeaders } from '../../lib/http'

// debounce helper for typing in filters
function useDebouncedValue<T>(value: T, delay = 300) {
  const [debounced, setDebounced] = useState(value)
  useEffect(() => {
    const t = setTimeout(() => setDebounced(value), delay)
    return () => clearTimeout(t)
  }, [value, delay])
  return debounced
}

export default function FeedPage() {
  const { ref, anon } = getClientEnv()

  // filters
  const [q, setQ] = useState('')
  const [order, setOrder] = useState<Order>('newest')
  const [min, setMin] = useState('')
  const [max, setMax] = useState('')
  const [limit, setLimit] = useState(10)

  const qDeb   = useDebouncedValue(q, 300)
  const minDeb = useDebouncedValue(min, 300)
  const maxDeb = useDebouncedValue(max, 300)

  // data state
  const [items, setItems] = useState<Row[]>([])
  const [cursorTs, setCursorTs] = useState<string | null>(null)
  const [cursorId, setCursorId] = useState<number | null>(null)
  const [loading, setLoading] = useState(false)
  const [err, setErr] = useState<string | null>(null)
  const [allLoaded, setAllLoaded] = useState(false)
  const [touched, setTouched] = useState(false)

  const baseUrl = useMemo(() => {
    if (!ref || !anon) return null
    const u = new URL(`https://${ref}.supabase.co/rest/v1/feed_items_public`)
    u.searchParams.set('select', '*')

    switch (order) {
      case 'newest': u.searchParams.set('order', 'inserted_at.desc,id.desc'); break
      case 'oldest': u.searchParams.set('order', 'inserted_at.asc,id.asc'); break
      case 'price_desc': u.searchParams.set('order', 'price.desc,id.desc'); break
      case 'price_asc': u.searchParams.set('order', 'price.asc,id.asc'); break
    }
    if (qDeb.trim()) u.searchParams.set('title', `ilike.*${qDeb.trim()}*`)
    if (minDeb !== '') u.searchParams.set('price', `gte.${Number(minDeb)}`)
    if (maxDeb !== '') u.searchParams.append('price', `lte.${Number(maxDeb)}`)
    return u
  }, [ref, anon, order, qDeb, minDeb, maxDeb])

  async function loadFirst() {
    if (!ref || !anon || !baseUrl) {
      setErr('Fehlende ENV: VITE_PROJECT_REF / VITE_SB_ANON_KEY')
      setTouched(true)
      return
    }
    setLoading(true); setErr(null); setAllLoaded(false); setCursorTs(null); setCursorId(null); setTouched(true)
    try {
      const u = new URL(baseUrl.toString()); u.searchParams.set('limit', String(limit))
      const data = await fetchJson<Row[]>(
        u,
        { headers: supabaseHeaders(anon), timeoutMs: 8000 },
        { retries: 2, backoffMs: 350 }
      )
      const safe = Array.isArray(data) ? data : []
      setItems(safe)
      if (safe.length) {
        const last = safe[safe.length - 1]
        setCursorTs(last.inserted_at); setCursorId(last.id); setAllLoaded(false)
      } else setAllLoaded(true)
    } catch (e: any) {
      setItems([]); setErr(e?.message ?? String(e))
    } finally { setLoading(false) }
  }

  async function loadMore() {
    if (loading || allLoaded || !baseUrl || !cursorTs || cursorId == null) return
    setLoading(true); setErr(null)
    try {
      const u = new URL(baseUrl.toString()); u.searchParams.set('limit', String(limit))
      u.searchParams.append(
        'or',
        `inserted_at.lt.${encodeURIComponent(cursorTs)},and(inserted_at.eq.${encodeURIComponent(cursorTs)},id.lt.${cursorId})`
      )
      const data = await fetchJson<Row[]>(
        u,
        { headers: supabaseHeaders(anon!), timeoutMs: 8000 },
        { retries: 2, backoffMs: 350 }
      )
      const safe = Array.isArray(data) ? data : []
      setItems(prev => [...prev, ...safe])
      if (safe.length) {
        const last = safe[safe.length - 1]
        setCursorTs(last.inserted_at); setCursorId(last.id)
      } else setAllLoaded(true)
    } catch (e: any) {
      setErr(e?.message ?? String(e))
    } finally { setLoading(false) }
  }

  useEffect(() => { void loadFirst() /* eslint-disable-line */ }, [qDeb, order, minDeb, maxDeb, limit])

  const showPager = items.length > 0 && !allLoaded
  const showEmpty = touched && !loading && !err && items.length === 0

  return (
    <main className="mx-auto max-w-4xl p-6 space-y-5">
      <h1 className="text-3xl font-bold">Latest Feed Items</h1>

      {/* Controls */}
      <div className="flex flex-wrap items-center gap-3">
        <input
          value={q} onChange={(e) => setQ(e.target.value)}
          placeholder="Titel suchen…" className="border rounded px-3 py-2 w-72"
          disabled={loading}
        />
        <select
          value={order} onChange={(e) => setOrder(e.target.value as Order)}
          className="border rounded px-3 py-2"
          disabled={loading}
        >
          <option value="newest">Neueste zuerst</option>
          <option value="oldest">Älteste zuerst</option>
          <option value="price_desc">Preis ↓</option>
          <option value="price_asc">Preis ↑</option>
        </select>
        <input
          value={min} onChange={(e) => setMin(e.target.value)}
          placeholder="Min €" inputMode="numeric" className="border rounded px-3 py-2 w-24"
          disabled={loading}
        />
        <input
          value={max} onChange={(e) => setMax(e.target.value)}
          placeholder="Max €" inputMode="numeric" className="border rounded px-3 py-2 w-24"
          disabled={loading}
        />
        <select
          value={limit} onChange={(e) => setLimit(Number(e.target.value))}
          className="border rounded px-3 py-2"
          disabled={loading}
        >
          <option value={5}>5 / Seite</option>
          <option value={10}>10 / Seite</option>
          <option value={20}>20 / Seite</option>
        </select>
      </div>

      {!ref || !anon ? (
        <div className="rounded border border-amber-300 bg-amber-50 p-3 text-sm">
          <strong>Hinweis:</strong> Es fehlen ENV-Werte für den Client.
        </div>
      ) : null}

      {err && (
        <div className="rounded border border-red-300 bg-red-50 p-3 text-sm text-red-800">
          <strong>Fehler:</strong> {err}
        </div>
      )}

      {loading && items.length === 0 && (
        <ul className="space-y-3 animate-pulse" aria-busy="true" aria-live="polite">
          {Array.from({ length: 5 }).map((_, i) => (
            <li key={i} className="border rounded p-3">
              <div className="h-4 w-2/3 bg-gray-200 rounded" />
              <div className="h-3 w-1/3 bg-gray-200 rounded mt-2" />
            </li>
          ))}
        </ul>
      )}

      {showEmpty && (
        <div className="rounded border border-gray-200 p-6 text-center text-sm text-gray-600">
          Keine Treffer für die aktuelle Auswahl.
        </div>
      )}

      {items.length > 0 && (
        <ul className="space-y-3" aria-busy={loading}>
          {items.map((it) => (
            <li key={it.id} className="border rounded p-3">
              <div className="flex items-baseline justify-between gap-3">
                <a href={it.url ?? '#'} target="_blank" rel="noreferrer" className="underline underline-offset-2">
                  {it.title ?? 'Untitled'}
                </a>
                <span className="text-sm text-gray-500">
                  {new Date(it.inserted_at).toLocaleString()}
                </span>
              </div>
              <div className="text-sm text-gray-700 mt-1">
                {it.price != null ? `${it.price} ${it.currency ?? ''}` : '—'}
              </div>
            </li>
          ))}
        </ul>
      )}

      {showPager && (
        <div>
          <button
            onClick={loadMore} disabled={loading}
            className="border rounded px-4 py-2 disabled:opacity-60"
          >
            {loading ? 'Laden…' : 'Mehr laden'}
          </button>
        </div>
      )}
    </main>
  )
}