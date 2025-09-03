/// <reference types="vite/client" />

interface ImportMetaEnv {
    readonly VITE_SUPABASE_URL: string;
    readonly VITE_SUPABASE_ANON_KEY: string;
    // weitere VITE_* Variablen bei Bedarf hier ergänzen
}

interface ImportMeta {
    readonly env: ImportMetaEnv;
}