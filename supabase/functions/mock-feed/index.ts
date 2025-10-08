import { serve } from "https://deno.land/std@0.224.0/http/server.ts";
import { corsHeaders } from "../_shared/cors.ts";

serve((req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: corsHeaders });

  const now = new Date().toISOString();
  return new Response(JSON.stringify([
    { title: "mock A", content: "hello", source: "mock", url: "https://a.example", created_at: now },
    { title: "mock B", content: "world", source: "mock", url: "https://b.example", created_at: now },
  ]), { headers: { ...corsHeaders, "content-type": "application/json" } });
});
