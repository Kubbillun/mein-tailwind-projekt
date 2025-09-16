// supabase/functions/ops-dispatcher/index.ts
import { createClient } from "jsr:@supabase/supabase-js@^2";

const H = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "GET,OPTIONS",
  "Access-Control-Allow-Headers": "authorization,apikey,content-type",
  "Content-Type": "application/json",
} as const;

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { status: 204, headers: H });

  const url = Deno.env.get("SB_URL") ?? "";
  const anon = Deno.env.get("SB_ANON_KEY") ?? "";
  const service = Deno.env.get("SB_SERVICE_ROLE_KEY") ?? "";
  if (!url || (!anon && !service)) {
    return new Response(JSON.stringify({ error: "Missing SB_URL or keys" }), { status: 500, headers: H });
  }

  // Übernimm eingehenden Auth-Header – oder fallback auf Service/Anon Key
  const authHeader =
    req.headers.get("Authorization") ??
    (service ? `Bearer ${service}` : `Bearer ${anon}`);

  const supabase = createClient(url, service || anon, {
    auth: { persistSession: false, autoRefreshToken: false },
    global: { headers: { Authorization: authHeader } },
  });

  const { data, error } = await supabase
    .from("feed_items")
    .select("id,title,source,created_at")
    .order("created_at", { ascending: false })
    .limit(10);

  if (error) return new Response(JSON.stringify({ error: error.message }), { status: 500, headers: H });
  return new Response(JSON.stringify({ ok: true, feed: data }), { status: 200, headers: H });
});