import { serve } from "https://deno.land/std@0.224.0/http/server.ts";
import "https://deno.land/x/xhr@0.4.0/mod.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import { corsHeaders } from "../_shared/cors.ts";

type InItem = { title?: string; content?: string; source?: string; url?: string; created_at?: string };

const enc = (s: string) => new TextEncoder().encode(s);
async function sha256Hex(s: string) {
  const buf = await crypto.subtle.digest("SHA-256", enc(s));
  return Array.from(new Uint8Array(buf)).map(b => b.toString(16).padStart(2,"0")).join("");
}

function txt(body: string, status = 200) {
  return new Response(body, { status, headers: { ...corsHeaders, "content-type": "text/plain; charset=utf-8" } });
}

serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: corsHeaders });
  if (req.method !== "POST")   return txt("POST only", 405);

  try {
    const url = Deno.env.get("SUPABASE_URL") ?? Deno.env.get("VITE_SUPABASE_URL");
    const serviceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? Deno.env.get("SERVICE_ROLE_KEY") ?? "";
    const anon = Deno.env.get("SUPABASE_ANON_KEY") ?? Deno.env.get("VITE_SUPABASE_ANON_KEY") ?? "";
    const FEED_URL = Deno.env.get("FEED_URL");

    if (!url)        return txt("SUPABASE_URL missing", 500);
    if (!serviceKey) return txt("service role key missing", 500);
    if (!FEED_URL)   return txt("FEED_URL missing", 400);

    const supabase = createClient(url, serviceKey);

    const headers: Record<string,string> = { accept: "application/json" };
    if (FEED_URL.includes("/functions/v1/") && anon) {
      headers.authorization = `Bearer ${anon}`;
      headers.apikey = anon;
    }

    const res = await fetch(FEED_URL, { headers });
    if (!res.ok) return txt(`fetch failed: ${res.status}`, 502);
    if (!((res.headers.get("content-type") ?? "").includes("json"))) return txt("no items (not json)", 200);

    const payload = await res.json();
    if (!Array.isArray(payload)) return txt("no items (payload not array)", 200);

    const items = await Promise.all(
      (payload as InItem[])
        .filter(it => (it?.title ?? "").trim())
        .map(async (it) => {
          const title = (it.title ?? "").trim();
          const source = (it.source ?? new URL(FEED_URL).hostname).trim();
          const content = it.content ?? null;
          const urlx = it.url ?? null;
          const created_at = it.created_at ?? new Date().toISOString();
          const content_hash = await sha256Hex([title, source, urlx ?? "", created_at].join("|"));
          return { title, content, source, created_at, content_hash, url: urlx };
        })
    );

    if (items.length === 0) return txt("no items", 200);

    const { error } = await supabase.from("feed_items")
      .upsert(items, { onConflict: "content_hash", ignoreDuplicates: true });
    if (error) throw error;

    return txt(`ok: ${items.length}`, 201);
  } catch (e) {
    return txt(String((e as any)?.message ?? e), 500);
  }
});
