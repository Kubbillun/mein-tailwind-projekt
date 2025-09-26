// ~/Projects/quickstart-crew/src/lib/fetchFeed.ts
export async function fetchFeed(limit: number = 5) {
  const url = `${process.env.NEXT_PUBLIC_SUPABASE_URL}/rest/v1/feed_items_public?select=*&order=inserted_at.desc,id.desc&limit=${limit}`

  const res = await fetch(url, {
    headers: {
      apikey: process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY as string,
      Authorization: `Bearer ${process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY}`,
    },
    cache: 'no-store',
  })

  if (!res.ok) {
    throw new Error(`fetchFeed failed: ${res.status} ${res.statusText}`)
  }

  return res.json()
}