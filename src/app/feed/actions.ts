// ~/Projects/quickstart-crew/src/app/feed/actions.ts
'use server'

import { fetchFeed } from '@/lib/fetchFeed'

export async function getFeed(limit: number = 5) {
  return fetchFeed(limit)
}