// ~/Projects/quickstart-crew/src/app/feed/page.tsx
'use server'

async function getFeed(limit: number) {
  const ref = process.env.PROJECT_REF
  const anon = process.env.SB_ANON_KEY
  if (!ref || !anon) {
    throw new Error('Missing PROJECT_REF or SB_ANON_KEY in environment')
  }

  const url = `https://${ref}.supabase.co/rest/v1/feed_items_public?select=*&order=inserted_at.desc,id.desc&limit=${limit}`
  const res = await fetch(url, {
    method: 'GET',
    headers: {
      apikey: anon,
      Authorization: `Bearer ${anon}`,
      Accept: 'application/json',
    },
    // Ensure fresh on each request in dev; adjust if you add ISR later
    cache: 'no-store',
  })

  if (!res.ok) {
    const text = await res.text().catch(() => '')
    throw new Error(`Feed fetch failed: ${res.status} ${res.statusText} ${text}`)
  }
  return (await res.json()) as Array<{
    id: number
    title: string | null
    price: number | null
    currency: string | null
    url: string | null
    inserted_at: string
  }>
}

type FeedItem = {
  id: number
  title: string | null
  price: number | null
  currency: string | null
  url: string | null
  inserted_at: string
}

export default async function FeedPage() {
  const items = (await getFeed(10)) as FeedItem[]

  return (
    <main className="mx-auto max-w-3xl p-6 space-y-6">
      <h1 className="text-2xl font-semibold">Latest Feed Items</h1>
      <ul className="space-y-4">
        {items.map((it) => (
          <li key={it.id} className="rounded-xl border p-4">
            <div className="flex items-baseline justify-between">
              <a
                href={it.url ?? '#'}
                target="_blank"
                rel="noreferrer"
                className="text-lg font-medium underline-offset-2 hover:underline"
              >
                {it.title || 'Untitled'}
              </a>
              <span className="text-sm text-gray-500">
                {new Date(it.inserted_at).toLocaleString()}
              </span>
            </div>
            <div className="mt-2 text-sm text-gray-700">
              {it.price != null ? `${it.price} ${it.currency ?? ''}` : '—'}
            </div>
            {it.url && (
              <div className="mt-2">
                <code className="rounded bg-gray-100 px-2 py-1 text-xs">{it.url}</code>
              </div>
            )}
          </li>
        ))}
      </ul>
    </main>
  )
}