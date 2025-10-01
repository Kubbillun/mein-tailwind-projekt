'use server'

type PageResp = { items: any[]; next?: { ts: string; id: number } }

export async function fetchFeedPage(params?: { ts?: string; id?: number; limit?: number }): Promise<PageResp> {
  const ref  = process.env.PROJECT_REF
  const anon = process.env.SB_ANON_KEY
  if (!ref || !anon) return { items: [] }

  const limit = params?.limit ?? 10
  const base  = `https://${ref}.supabase.co/rest/v1/feed_items_public?select=*`
  const order = '&order=inserted_at.desc,id.desc'
  const pageQ = params?.ts && params?.id
    ? `&or=(inserted_at.lt.${encodeURIComponent(params.ts)},and(inserted_at.eq.${encodeURIComponent(params.ts)},id.lt.${params.id}))`
    : ''
  const url   = `${base}${order}${pageQ}&limit=${limit}`

  try {
    const res = await fetch(url, { headers: { apikey: anon, Authorization: `Bearer ${anon}` }, cache: 'no-store' })
    if (!res.ok) return { items: [] }
    const items = await res.json()
    if (!Array.isArray(items) || items.length === 0) return { items: [] }
    const last = items[items.length - 1]
    return { items, next: { ts: last.inserted_at, id: last.id } }
  } catch {
    return { items: [] }
  }
}