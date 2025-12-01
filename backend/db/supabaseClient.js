/**
 * Supabase client with caching for Vercel serverless
 * Creates a singleton client instance that's reused across function invocations
 */

import { createClient } from '@supabase/supabase-js';

const SUPABASE_URL = process.env.SUPABASE_URL;
const SUPABASE_SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!SUPABASE_URL || !SUPABASE_SERVICE_ROLE_KEY) {
  console.warn(
    '⚠️  Supabase credentials not found. Database operations will fail. ' +
    'Please set SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY environment variables.'
  );
}

// Cache the client instance (reused across function invocations)
let supabaseClient = null;

/**
 * Get or create a Supabase client instance
 * Uses singleton pattern for Vercel serverless optimization
 */
export function getSupabaseClient() {
  if (supabaseClient) {
    return supabaseClient;
  }

  if (!SUPABASE_URL || !SUPABASE_SERVICE_ROLE_KEY) {
    throw new Error(
      'Supabase credentials not configured. ' +
      'Please set SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY environment variables.'
    );
  }

  supabaseClient = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY, {
    auth: {
      autoRefreshToken: false,
      persistSession: false,
    },
  });

  return supabaseClient;
}

