// ~/Projects/quickstart-crew/supabase/functions/ops-dispatcher/index.ts
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

// Keys/URL aus Supabase Secrets
const url = Deno.env.get("SB_URL")!;
const serviceKey = Deno.env.get("SB_SERVICE_ROLE_KEY")!;

Deno.serve(async (_req) => {
  const supabase = createClient(url, serviceKey, {
    auth: { persistSession: false },
  });

  const { data, error } = await supabase
    .from("feed_items")
    .select("id, title, source, created_at")
    .order("created_at", { ascending: false })
    .limit(5);

  if (error) {
    return new Response(
      JSON.stringify({ error: error.message }),
      {
        status: 500,
        headers: { "Content-Type": "application/json" },
      },
    );
  }

  return new Response(
    JSON.stringify({ ok: true, feed: data ?? [] }),
    { headers: { "Content-Type": "application/json" } },
  );
});