import { createClient } from '@supabase/Bolt_Database-js';

const Bolt_DatabaseUrl = import.meta.env.VITE_Bolt_Database_URL;
const Bolt_DatabaseAnonKey = import.meta.env.VITE_Bolt_Database_ANON_KEY;

if (!Bolt_DatabaseUrl || !Bolt_DatabaseAnonKey) {
  throw new Error('Missing Bolt Database environment variables');
}

export const Bolt_Database = createClient(Bolt_DatabaseUrl, Bolt_DatabaseAnonKey);
