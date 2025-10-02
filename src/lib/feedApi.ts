// src/lib/feedApi.ts
import { fetchJson } from './http'
import { z } from 'zod'

// ---- Runtime-Schema (gegen REST-Antwort prüfen)
export const RowSchema = z.object({
  id: z.number().int(),
  external_id: z.string().nullable().optional(),
  title: z.string().nullable(),
  price: z.number().nullable(),
  currency: z.string().nullable(),
  url: z.string().url().nullable(),
  inserted_at: z.string(), // ISO
})
export type Row = z.infer<typeof RowSchema>

// Liste
const RowsSchema = z.array(RowSchema)

// ---- Query-Parameter
export type FeedOrder = 'newest' | 'oldest' | 'price_desc' | 'price_asc'
export type FeedParams = {
  q?: string
  min?: number
  max?: number
  order?: FeedOrder
  limit?: number
  lastTs?: string | null
  lastId?: number | null
}

// ---- API
export async function fetchFeedPage(params: FeedParams): Promise<Row[]> {
  const ref = (globalThis as any).__VITE_PROJECT_REF ?? import.meta?.env?.VITE_PROJECT_REF
  const anon = (globalThis as any).__VITE_SB_ANON_KEY ?? import.meta?.env?.VITE_SB_ANON_KEY
  if (!ref || !anon) return []

  // base query
  const u = new URL(`https://${ref}.supabase.co/rest/v1/feed_items_public`)
  u.searchParams.set('select', '*')

  // ordering
  const order = params.order ?? 'newest'
  switch (order) {
    case 'newest':      u.searchParams.set('order', 'inserted_at.desc,id.desc'); break
    case 'oldest':      u.searchParams.set('order', 'inserted_at.asc,id.asc'); break
    case 'price_desc':  u.searchParams.set('order', 'price.desc,id.desc'); break
    case 'price_asc':   u.searchParams.set('order', 'price.asc,id.asc'); break
  }

  // filters
  if (params.q?.trim()) u.searchParams.set('title', `ilike.%${params.q.trim()}%`)
  if (typeof params.min === 'number') u.searchParams.set('price', `gte.${params.min}`)
  if (typeof params.max === 'number') u.searchParams.append('price', `lte.${params.max}`)

  // cursor (keyset)
  if (params.lastTs && params.lastId != null) {
    const ts = encodeURIComponent(params.lastTs)
    const id = params.lastId
    u.searchParams.append(
      'or',
      `(inserted_at.lt.${ts},and(inserted_at.eq.${ts},id.lt.${id}))`
    )
  }

  u.searchParams.set('limit', String(params.limit ?? 10))

  // fetch (mit Timeout/Retry aus http.ts)
  const data = await fetchJson(u.toString(), {
    headers: { apikey: anon, Authorization: `Bearer ${anon}` },
    timeoutMs: 8000,
    retries: 2,
  }).catch(() => null)

  if (!Array.isArray(data)) return []

  const parsed = RowsSchema.safeParse(data)
  if (!parsed.success) {
    // optional: console.warn(parsed.error.format())
    return []
  }
  return parsed.data
}