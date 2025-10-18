import { createClient } from '@supabase/supabase-js';

// 🔐 Läs miljövariabler från Vite (.env)
const SUPABASE_URL = import.meta.env.VITE_SUPABASE_URL;
const SUPABASE_ANON_KEY = import.meta.env.VITE_SUPABASE_ANON_KEY;

// 🚨 Säkerhetskontroll — stoppa om något saknas
if (!SUPABASE_URL || !SUPABASE_ANON_KEY) {
  throw new Error('❌ Missing Supabase environment variables. Check your .env file.');
}

// ⚙️ Skapa en *enda* Supabase-klientinstans
export const Bolt_Database = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

// ✅ (Valfritt) Exportera typer direkt för enklare import i resten av appen
export type { User, Session } from '@supabase/supabase-js';
