import { createClient, SupabaseClient } from '@supabase/supabase-js';

function requiredEnv(name: string, fallbackName?: string): string {
  const value = process.env[name] || (fallbackName ? process.env[fallbackName] : undefined);
  if (!value) {
    throw new Error(`Missing required backend environment variable: ${name}`);
  }
  return value;
}

/**
 * Create a request-scoped Supabase client using the publishable/anon client key.
 *
 * The caller JWT is forwarded as Authorization so Row Level Security remains the
 * authorization boundary. Service-role fallback and hardcoded project keys are
 * intentionally retired from the BOH tRPC data plane.
 */
export function getBackendSupabase(accessToken?: string): SupabaseClient {
  const supabaseUrl = requiredEnv('SUPABASE_URL', 'EXPO_PUBLIC_SUPABASE_URL');
  const publishableKey = requiredEnv('SUPABASE_ANON_KEY', 'EXPO_PUBLIC_SUPABASE_ANON_KEY');

  return createClient(supabaseUrl, publishableKey, {
    auth: {
      autoRefreshToken: false,
      persistSession: false,
      detectSessionInUrl: false,
    },
    ...(accessToken
      ? {
          global: {
            headers: {
              Authorization: `Bearer ${accessToken}`,
            },
          },
        }
      : {}),
  });
}
