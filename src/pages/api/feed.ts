// ~/Projects/quickstart-crew/src/pages/api/feed.ts
import type { NextApiRequest, NextApiResponse } from 'next'
import { fetchFeed } from '@/lib/fetchFeed'

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  try {
    const limit = parseInt((req.query.limit as string) || '5', 10)
    const data = await fetchFeed(limit)
    res.status(200).json(data)
  } catch (error: any) {
    res.status(500).json({ error: error.message })
  }
}