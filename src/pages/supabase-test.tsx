import { useEffect, useState } from "react"
import { supabase } from "../lib/supabaseClient"

export default function SupabaseTest() {
  const [message, setMessage] = useState("Lade...")

  useEffect(() => {
    async function checkConnection() {
      const { data, error } = await supabase.from("ops_alert_outbox").select("id").limit(1)
      if (error) {
        setMessage("Fehler: " + error.message)
      } else {
        setMessage("Verbindung erfolgreich ✅ – " + (data?.length ?? 0) + " Zeilen gefunden")
      }
    }
    checkConnection()
  }, [])

  return (
    <div style={{ padding: "2rem", fontFamily: "sans-serif" }}>
      <h1>Supabase Test</h1>
      <p>{message}</p>
    </div>
  )
}