/**
 * Supabase client configuration
 * 
 * Creates a serverless-friendly Supabase client using service role key.
 * No persistent connections - creates a new client instance each time (Vercel-compatible).
 */

import { createClient, SupabaseClient } from '@supabase/supabase-js';

const SUPABASE_URL = process.env.SUPABASE_URL;
const SUPABASE_SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!SUPABASE_URL || !SUPABASE_SERVICE_ROLE_KEY) {
  console.warn(
    '⚠️  Supabase credentials not found. Database operations will fail. ' +
    'Please set SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY environment variables.'
  );
}

/**
 * Get a Supabase client instance
 * 
 * Creates a new client each time (stateless, serverless-friendly).
 * Uses service role key for full database access (bypasses RLS).
 * 
 * @returns Supabase client instance
 */
export function getSupabaseClient(): SupabaseClient {
  if (!SUPABASE_URL || !SUPABASE_SERVICE_ROLE_KEY) {
    throw new Error(
      'Supabase credentials not configured. ' +
      'Please set SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY environment variables.'
    );
  }

  return createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY, {
    auth: {
      autoRefreshToken: false,
      persistSession: false,
    },
  });
}

