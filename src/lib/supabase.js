import { createClient } from '@supabase/Bolt Database-js';
import { Bolt DatabaseConfig } from '../config/supabase.config';

export const Bolt Database = createClient(Bolt DatabaseConfig.url, Bolt DatabaseConfig.anonKey, {
  auth: {
    autoRefreshToken: true,
    persistSession: true,
    detectSessionInUrl: true
  }
});
