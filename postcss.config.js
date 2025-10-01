// src/lib/clientEnv.ts
/**
 * Liefert die beiden für den Feed nötigen Werte aus allen sinnvollen Quellen:
 * - import.meta.env (Vite Injection)
 * - window.__VITE (falls später gesetzt)
 * - process.env.* (falls SSR / Tests)
 */
export function getClientEnv() {
  const viteEnv = (import.meta as any)?.env ?? {};
  const win = (typeof window !== "undefined" ? (window as any) : {}) ?? {};

  const ref =
    viteEnv.VITE_PROJECT_REF ??
    win.__VITE?.VITE_PROJECT_REF ??
    (typeof process !== "undefined" ? (process as any).env?.VITE_PROJECT_REF : undefined) ??
    (typeof process !== "undefined" ? (process as any).env?.PROJECT_REF : undefined);

  const anon =
    viteEnv.VITE_SB_ANON_KEY ??
    win.__VITE?.VITE_SB_ANON_KEY ??
    (typeof process !== "undefined" ? (process as any).env?.VITE_SB_ANON_KEY : undefined) ??
    (typeof process !== "undefined" ? (process as any).env?.SB_ANON_KEY : undefined);

  return { ref, anon, viteEnv, winVite: win.__VITE };
}

/** Optional: Fürs schnelle Debugging im Browser-Fenster */
export function exposeEnvForDebug() {
  try {
    const g = getClientEnv();
    (window as any).__VITE = {
      VITE_PROJECT_REF: g.ref ?? "",
      VITE_SB_ANON_KEY: g.anon ?? "",
    };
    // ein bisschen loggen, aber Key nicht komplett ausgeben
    /* eslint-disable no-console */
    console.log("[clientEnv] import.meta.env:", g.viteEnv);
    console.log(
      "[clientEnv] window.__VITE:",
      (window as any).__VITE
        ? { ...(window as any).__VITE, VITE_SB_ANON_KEY: "********" }
        : null
    );
    /* eslint-enable no-console */
  } catch {
    /* noop */
  }
}