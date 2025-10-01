// src/app/feed/page.tsx
import { useEffect, useMemo, useState } from 'react'
import { getClientEnv } from '../../lib/clientEnv'

type Row = {
  id: number
  title: string | null
  price: number | null
  currency: string | null
  url: string | null
  inserted_at: string
}

type Order = 'newest' | 'oldest' | 'price_desc' | 'price_asc'

export default function FeedPage() {
  const { ref, anon } = getClientEnv()

  // UI state
  const [q, setQ] = useState('')
  const [order, setOrder] = useState<Order>('newest')
  const [min, setMin] = useState('')
  const [max, setMax] = useState('')
  const [limit, setLimit] = useState(10)

  // data state
  const [items, setItems] = useState<Row[]>([])
  const [cursorTs, setCursorTs] = useState<string | null>(null)
  const [cursorId, setCursorId] = useState<number | null>(null)
  const [loading, setLoading] = useState(false)
  const [err, setErr] = useState<string | null>(null)
  const [allLoaded, setAllLoaded] = useState(false)

  const baseUrl = useMemo(() => {
    if (!ref || !anon) return null
    const u = new URL(`https://${ref}.supabase.co/rest/v1/feed_items_public`)
    u.searchParams.set('select', '*')

    // order
    switch (order) {
      case 'newest':
        u.searchParams.set('order', 'inserted_at.desc,id.desc')
        break
      case 'oldest':
        u.searchParams.set('order', 'inserted_at.asc,id.asc')
        break
      case 'price_desc':
        u.searchParams.set('order', 'price.desc,id.desc')
        break
      case 'price_asc':
        u.searchParams.set('order', 'price.asc,id.asc')
        break
    }

    // filters
    if (q.trim()) u.searchParams.set('title', `ilike.*${q.trim()}*`)
    if (min !== '') u.searchParams.set('price', `gte.${Number(min)}`)
    if (max !== '') u.searchParams.append('price', `lte.${Number(max)}`)

    return u
  }, [ref, anon, order, q, min, max])

  async function loadFirst() {
    if (!ref || !anon || !baseUrl) {
      setErr('Fehlende ENV: VITE_PROJECT_REF / VITE_SB_ANON_KEY')
      return
    }
    setLoading(true)
    setErr(null)
    setAllLoaded(false)
    setCursorTs(null)
    setCursorId(null)
    try {
      const u = new URL(baseUrl.toString())
      u.searchParams.set('limit', String(limit))

      const r = await fetch(u, {
        headers: { apikey: anon!, Authorization: `Bearer ${anon!}`, Accept: 'application/json' },
      })
      if (!r.ok) throw new Error(`HTTP ${r.status}`)
      const data = (await r.json()) as Row[]
      setItems(Array.isArray(data) ? data : [])
      if (data?.length) {
        const last = data[data.length - 1]
        setCursorTs(last.inserted_at)
        setCursorId(last.id)
        setAllLoaded(false)
      } else {
        setAllLoaded(true)
      }
    } catch (e: any) {
      setItems([])
      setErr(e?.message ?? String(e))
    } finally {
      setLoading(false)
    }
  }

  async function loadMore() {
    if (loading || allLoaded || !baseUrl || !cursorTs || cursorId == null) return
    setLoading(true)
    setErr(null)
    try {
      const u = new URL(baseUrl.toString())
      u.searchParams.set('limit', String(limit))

      // cursor (keyset pagination)
      // inserted_at < ts OR (inserted_at = ts AND id < id)
      u.searchParams.append(
        'or',
        `inserted_at.lt.${encodeURIComponent(cursorTs)},and(inserted_at.eq.${encodeURIComponent(
          cursorTs,
        )},id.lt.${cursorId})`,
      )

      const r = await fetch(u, {
        headers: { apikey: anon!, Authorization: `Bearer ${anon!}`, Accept: 'application/json' },
      })
      if (!r.ok) throw new Error(`HTTP ${r.status}`)
      const data = (await r.json()) as Row[]
      const safe = Array.isArray(data) ? data : []
      setItems((prev) => [...prev, ...safe])
      if (safe.length) {
        const last = safe[safe.length - 1]
        setCursorTs(last.inserted_at)
        setCursorId(last.id)
      } else {
        setAllLoaded(true)
      }
    } catch (e: any) {
      setErr(e?.message ?? String(e))
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    void loadFirst()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [q, order, min, max, limit])

  return (
    <main style={{ padding: 16 }}>
      <h1>Latest Feed Items</h1>

      {/* Controls */}
      <div style={{ display: 'flex', gap: 8, alignItems: 'center', flexWrap: 'wrap', marginBottom: 12 }}>
        <input value={q} onChange={(e) => setQ(e.target.value)} placeholder="Titel suchen…" style={{ padding: 8 }} />
        <select value={order} onChange={(e) => setOrder(e.target.value as Order)} style={{ padding: 8 }}>
          <option value="newest">Neueste zuerst</option>
          <option value="oldest">Älteste zuerst</option>
          <option value="price_desc">Preis ↓</option>
          <option value="price_asc">Preis ↑</option>
        </select>
        <input value={min} onChange={(e) => setMin(e.target.value)} placeholder="Min €" inputMode="numeric" style={{ padding: 8, width: 90 }} />
        <input value={max} onChange={(e) => setMax(e.target.value)} placeholder="Max €" inputMode="numeric" style={{ padding: 8, width: 90 }} />
        <select value={limit} onChange={(e) => setLimit(Number(e.target.value))} style={{ padding: 8 }}>
          <option value={5}>5 / Seite</option>
          <option value={10}>10 / Seite</option>
          <option value={20}>20 / Seite</option>
        </select>
      </div>

      {/* Status */}
      {!ref || !anon ? (
        <div style={{ padding: 12, border: '1px solid #f0c36d', background: '#fff8e1', marginBottom: 12 }}>
          <strong>Hinweis:</strong> Es fehlen ENV-Werte für den Client.
        </div>
      ) : null}
      {err && <div style={{ color: 'crimson', marginBottom: 12 }}>Fehler: {err}</div>}

      {/* List */}
      <ul>
        {items.map((it) => (
          <li key={it.id}>
            <a href={it.url ?? '#'} target="_blank" rel="noreferrer">
              {it.title ?? 'Untitled'}
            </a>{' '}
            — {it.price ?? '—'} {it.currency ?? ''}
          </li>
        ))}
      </ul>

      {/* Pager */}
      <div style={{ marginTop: 12 }}>
        <button onClick={loadMore} disabled={loading || allLoaded} style={{ padding: '8px 12px' }}>
          {allLoaded ? 'Alles geladen' : loading ? 'Laden…' : 'Mehr laden'}
        </button>
      </div>
    </main>
  )
}