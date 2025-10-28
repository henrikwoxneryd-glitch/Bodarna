import { createClient } from '@supabase/supabase-js';

// Miljövariabler från Vite (.env-filen)
const SUPABASE_URL = import.meta.env.VITE_SUPABASE_URL!;
const SUPABASE_ANON_KEY = import.meta.env.VITE_SUPABASE_ANON_KEY!;

// Säkerhetskoll – stoppa om något saknas
if (!SUPABASE_URL || !SUPABASE_ANON_KEY) {
  throw new Error('Missing Supabase environment variables');
}

// Skapa och exportera en enda Supabase-klient
export const Bolt_Database = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);
