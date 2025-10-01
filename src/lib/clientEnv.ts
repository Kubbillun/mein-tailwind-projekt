// src/lib/clientEnv.ts
/**
 * Liefert die für den Feed nötigen ENV-Werte stabil – auch wenn import.meta.env als Objekt
 * zur Laufzeit nicht existiert. Wir nutzen:
 *  - direkte Inline-Replacements (import.meta.env.VITE_*),
 *  - zusätzlich definierte Konstanten (__VITE_*),
 *  - window.__VITE (manuelles Debug-Override),
 *  - process.env (SSR/Node).
 */

// Diese Deklarationen erlauben die Nutzung unserer per Vite `define` gesetzten Konstanten.
declare const __VITE_PROJECT_REF__: string
declare const __VITE_SB_ANON_KEY__: string

export function getClientEnv() {
  // 1) Direkte Vite-Inlines (funktionieren auch wenn `import.meta.env` als Objekt undefined ist)
  //    Achtung: KEIN optional chaining vor `.env` – wir greifen direkt auf den Ausdruck zu.
  //    @ts-ignore – Vite ersetzt diese Ausdrücke beim Bundling.
  const inlineRef = import.meta.env.VITE_PROJECT_REF as string
  //    @ts-ignore
  const inlineAnon = import.meta.env.VITE_SB_ANON_KEY as string

  // 2) Unsere expliziten Konstanten aus vite.config.ts
  const constRef =
    typeof __VITE_PROJECT_REF__ !== 'undefined' && __VITE_PROJECT_REF__ !== '' ? __VITE_PROJECT_REF__ : undefined
  const constAnon =
    typeof __VITE_SB_ANON_KEY__ !== 'undefined' && __VITE_SB_ANON_KEY__ !== '' ? __VITE_SB_ANON_KEY__ : undefined

  // 3) Fenster-Overrides (Debug)
  const win: any = typeof window !== 'undefined' ? (window as any) : undefined
  const winRef = win?.__VITE?.VITE_PROJECT_REF
  const winAnon = win?.__VITE?.VITE_SB_ANON_KEY

  // 4) Prozess-Umgebung (SSR/Tests)
  const proc: any = typeof process !== 'undefined' ? process : undefined
  const procRef = proc?.env?.VITE_PROJECT_REF ?? proc?.env?.PROJECT_REF
  const procAnon = proc?.env?.VITE_SB_ANON_KEY ?? proc?.env?.SB_ANON_KEY

  const ref = inlineRef || constRef || winRef || procRef
  const anon = inlineAnon || constAnon || winAnon || procAnon

  return { ref, anon }
}

/** Optionales Debug-Expose im Browserfenster */
export function exposeEnvForDebug() {
  try {
    const g = getClientEnv()
    ;(window as any).__VITE = {
      VITE_PROJECT_REF: g.ref ?? '',
      VITE_SB_ANON_KEY: g.anon ?? '',
    }
    // eslint-disable-next-line no-console
    console.info('[env] ref?', !!g.ref, ' anon?', !!g.anon)
  } catch {
    /* noop */
  }
}