// src/lib/http.ts
export type RetryOpts = {
  retries?: number
  backoffMs?: number
  timeoutMs?: number
}

export async function fetchJson<T>(
  input: RequestInfo | URL,
  init: RequestInit & { timeoutMs?: number } = {},
  retry: RetryOpts = {}
): Promise<T> {
  const { timeoutMs = init.timeoutMs ?? 8000 } = init
  const { retries = 1, backoffMs = 400 } = retry

  let lastErr: unknown
  for (let attempt = 0; attempt <= retries; attempt++) {
    const ctrl = new AbortController()
    const t = setTimeout(() => ctrl.abort(), timeoutMs)

    try {
      const res = await fetch(input, { ...init, signal: ctrl.signal })
      clearTimeout(t)
      if (!res.ok) {
        const txt = await safeText(res)
        throw new Error(`HTTP ${res.status} ${res.statusText}${txt ? ` – ${txt}` : ''}`)
      }
      return (await res.json()) as T
    } catch (e) {
      clearTimeout(t)
      lastErr = e
      if (attempt < retries) {
        await sleep(backoffMs * Math.pow(2, attempt))
        continue
      }
      throw lastErr
    }
  }
  throw lastErr
}

export function supabaseHeaders(anonKey: string): Headers {
  return new Headers({
    apikey: anonKey,
    Authorization: `Bearer ${anonKey}`,
    Accept: 'application/json',
  })
}

function sleep(ms: number) {
  return new Promise((r) => setTimeout(r, ms))
}

async function safeText(res: Response) {
  try {
    return await res.text()
  } catch {
    return ''
  }
}