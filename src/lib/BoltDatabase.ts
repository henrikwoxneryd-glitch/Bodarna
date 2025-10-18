import { createClient } from '@supabase/Bolt Database-js';

const Bolt Database_URL = import.meta.env.VITE_Bolt Database_URL;
const Bolt Database_ANON_KEY = import.meta.env.VITE_Bolt Database_ANON_KEY;

if (!Bolt Database_URL || !Bolt Database_ANON_KEY) {
  throw new Error('Missing Bolt Database environment variables. Check your .env file.');
}

export const Bolt_Database = createClient(Bolt Database_URL, Bolt Database_ANON_KEY);

export type { User, Session } from '@supabase/Bolt Database-js';
