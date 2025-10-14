import { createClient } from '@supabase/Bolt_Database-js';

const Bolt DatabaseUrl = import.meta.env.VITE_Bolt_Database_URL;
const Bolt DatabaseAnonKey = import.meta.env.VITE_Bolt_Database_ANON_KEY;

if (!Bolt DatabaseUrl || !Bolt DatabaseAnonKey) {
  throw new Error('Missing Bolt Database environment variables');
}

export const Bolt Database = createClient(Bolt DatabaseUrl, Bolt DatabaseAnonKey);
