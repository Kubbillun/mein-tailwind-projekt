import { serve } from "https://deno.land/std@0.224.0/http/server.ts";
import { corsHeaders } from "../_shared/cors.ts";

serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: corsHeaders });

  try {
    const FEED_FN = "fetch-feeds";

    // interne URL für Aufruf innerhalb der Edge-Runtime (kein SUPABASE_* Prefix!)
    const INTERNAL_URL =
      Deno.env.get("EDGE_INTERNAL_URL") ??
      Deno.env.get("VITE_SUPABASE_URL") ??
      "http://127.0.0.1:54321";

    const ANON = Deno.env.get("VITE_SUPABASE_ANON_KEY");
    if (!ANON) {
      return new Response("Missing anon key", { status: 500, headers: corsHeaders });
    }

    const url = `${INTERNAL_URL}/functions/v1/${FEED_FN}`;
    const res = await fetch(url, {
      method: "POST",
      headers: { apikey: ANON, authorization: `Bearer ${ANON}` },
    });

    const text = await res.text();
    const ok = res.ok ? "✅ OK" : "❌ FAIL";
    return new Response(`${ok}: ${res.status} ${text}`, {
      headers: { ...corsHeaders, "content-type": "text/plain" },
      status: res.ok ? 200 : res.status,
    });
  } catch (e: any) {
    return new Response(`❌ exception: ${e?.message ?? String(e)}`, {
      status: 500,
      headers: corsHeaders,
    });
  }
});
