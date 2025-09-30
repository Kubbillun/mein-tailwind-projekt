// src/lib/feedApi.ts
// Robust client-side REST helper for the public feed + verbose debug logging

export type FeedOrder = 'newest' | 'oldest' | 'price_desc' | 'price_asc'

export type FeedParams = {
  q?: string               // title substring
  order?: FeedOrder        // sort
  min?: number             // min price
  max?: number             // max price
  limit?: number           // page size
  lastTs?: string | null   // pagination: ISO timestamp (previous last row)
  lastId?: number | null   // pagination: numeric id (previous last row)
}

// Resolve env from Vite or (as last resort) process/window if present
const REF =
  (typeof import.meta !== 'undefined' && (import.meta as any).env?.VITE_PROJECT_REF) ??
  (typeof process !== 'undefined' ? (process as any).env?.VITE_PROJECT_REF ?? (process as any).env?.PROJECT_REF : undefined) ??
  (typeof window !== 'undefined' ? (window as any).VITE_PROJECT_REF : undefined)

const ANON =
  (typeof import.meta !== 'undefined' && (import.meta as any).env?.VITE_SB_ANON_KEY) ??
  (typeof process !== 'undefined' ? (process as any).env?.VITE_SB_ANON_KEY ?? (process as any).env?.SB_ANON_KEY : undefined) ??
  (typeof window !== 'undefined' ? (window as any).VITE_SB_ANON_KEY : undefined)

function requireEnv() {
  if (!REF || !ANON) {
    throw new Error('Missing VITE_PROJECT_REF / VITE_SB_ANON_KEY')
  }
}

function buildUrl(p: FeedParams): URL {
  requireEnv()
  const base = `https://${REF}.supabase.co/rest/v1/feed_items_public`
  const u = new URL(base)

  // always select full row
  u.searchParams.set('select', '*')

  // ordering
  const order = p.order ?? 'newest'
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

  // search by title (case-insensitive)
  if (p.q && p.q.trim().length) {
    u.searchParams.set('title', `ilike.*${p.q.trim()}*`)
  }

  // price range (PostgREST supports repeating the same key with different operators)
  if (typeof p.min === 'number') {
    u.searchParams.append('price', `gte.${p.min}`)
  }
  if (typeof p.max === 'number') {
    u.searchParams.append('price', `lte.${p.max}`)
  }

  // pagination: keyset by (inserted_at, id)
  if (p.lastTs && p.lastId != null) {
    const tsEnc = encodeURIComponent(p.lastTs)
    u.searchParams.set('and', `(inserted_at.lt.${tsEnc},id.lt.${p.lastId})`)
  }

  // page size
  u.searchParams.set('limit', String(p.limit ?? 10))

  return u
}

/**
 * Fetch one page of feed rows with given params
 */
export async function fetchFeedPage(params: FeedParams): Promise<any[]> {
  // ---- DEBUG: show resolved env at runtime
  console.info('[feedApi] REF:', REF, 'ANON exists:', !!ANON)

  // Guard against accidental null params from the caller
  const p: FeedParams = params ?? {}
  const url = buildUrl(p)
  const urlStr = url.toString()

  // ---- DEBUG: show final URL
  console.info('[feedApi] GET', urlStr)

  let res: Response
  try {
    res = await fetch(urlStr, {
      headers: {
        apikey: String(ANON ?? ''),
        Authorization: `Bearer ${String(ANON ?? '')}`,
        Accept: 'application/json',
      },
    })
  } catch (e) {
    // ---- DEBUG: network-layer failure (DNS/CORS/https/mixed content/etc.)
    console.error('[feedApi] fetch failed:', e)
    throw e
  }

  if (!res.ok) {
    const text = await res.text().catch(() => '')
    // ---- DEBUG: HTTP-layer failure with body
    console.error('[feedApi] HTTP', res.status, res.statusText, text)
    throw new Error(`Feed fetch failed: ${res.status} ${res.statusText} ${text}`)
  }

  const json = (await res.json()) as any[]
  return Array.isArray(json) ? json : []
}

// convenience alias some code may import
export const fetchFeed = fetchFeedPage