import 'react-native-url-polyfill/auto';
import { createClient, SupabaseClient } from '@supabase/supabase-js';
import AsyncStorage from '@react-native-async-storage/async-storage';

const supabaseUrl = process.env.EXPO_PUBLIC_SUPABASE_URL;
const supabaseAnonKey = process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY;

// DIAGNOSTIC: Check if env vars exist at runtime
const hasUrl = !!process.env.EXPO_PUBLIC_SUPABASE_URL;
const hasKey = !!process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY;
const url = process.env.EXPO_PUBLIC_SUPABASE_URL || 'MISSING';
const keyPreview = (process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY || '').slice(0, 6) + '...';

console.log('🔍 SUPABASE CONFIG DIAGNOSTIC:', {
  hasUrl,
  hasKey,
  url,
  keyPreview
});

export const DIAGNOSTIC_INFO = {
  hasUrl,
  hasKey,
  url,
  keyPreview
};

export const SUPABASE_CONFIG_OK = !!(supabaseUrl && supabaseAnonKey);

let supabaseInstance: SupabaseClient | null = null;

export function getSupabase(): SupabaseClient {
  if (!SUPABASE_CONFIG_OK) {
    throw new Error(
      'Supabase configuration missing. Please set EXPO_PUBLIC_SUPABASE_URL and EXPO_PUBLIC_SUPABASE_ANON_KEY in your .env file.'
    );
  }

  if (!supabaseInstance) {
    supabaseInstance = createClient(supabaseUrl!, supabaseAnonKey!, {
      auth: {
        storage: AsyncStorage,
        autoRefreshToken: true,
        persistSession: true,
        detectSessionInUrl: false,
      },
    });
  }

  return supabaseInstance;
}

export const supabase = SUPABASE_CONFIG_OK ? getSupabase() : (null as any);
