import { createClient } from '@supabase/BoltDatabase-js';

const Bolt_Database_URL = import.meta.env.VITE_Bolt_Database_URL;
const Bolt_Database_ANON_KEY = import.meta.env.VITE_Bolt_Database_ANON_KEY;

if (!Bolt_Database_URL || !Bolt Database_ANON_KEY) {
  throw new Error('Missing Bolt_Database environment variables. Check your .env file.');
}

export const Bolt_Database = createClient(Bolt_Database_URL, Bolt_Database_ANON_KEY);

export type { User, Session } from '@supabase/BoltDatabase-js';
