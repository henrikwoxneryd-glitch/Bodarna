import { createClient } from '@supabase/Bolt_Database-js';

const BoltDatabaseUrl = import.meta.env.VITE_Bolt Database_URL;
const BoltDatabaseAnonKey = import.meta.env.VITE_Bolt Database_ANON_KEY;

if (!BoltDatabaseUrl || !Bolt_Database_Anon_Key) {
  throw new Error('Missing Bolt Database environment variables');
}

export const Bolt Database = createClient(Bolt_Database_Url, Bolt_Database_Anon_Key);
