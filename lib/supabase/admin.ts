import { createClient as createClientOriginal } from '@supabase/supabase-js';

export function createAdminClient() {
  const supabaseUrl = process.env.SUPABASE_URL;
  const serviceKey =
    process.env.SUPABASE_SECRET_KEY ||
    process.env.SUPABASE_SERVICE_ROLE_KEY ||
    process.env.SUPABASE_SECRET;

  if (!supabaseUrl || !serviceKey) {
    throw new Error('Missing Supabase admin configuration (SUPABASE_URL + SUPABASE_SECRET_KEY/SUPABASE_SERVICE_ROLE_KEY)');
  }

  return createClientOriginal(supabaseUrl, serviceKey);
}

