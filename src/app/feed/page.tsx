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