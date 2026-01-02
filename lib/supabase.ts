import 'react-native-url-polyfill/auto';
import { createClient, SupabaseClient } from '@supabase/supabase-js';
import AsyncStorage from '@react-native-async-storage/async-storage';

const supabaseUrl = 'https://wfkohcwxxsrhcxhepfql.supabase.co';
const supabaseAnonKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Indma29oY3d4eHNyaGN4aGVwZnFsIiwicm9sZSI6ImFub24iLCJpYXQiOjE3MjUzMTg5MjksImV4cCI6MjA0MDg5NDkyOX0.eL5SoR6I0MSC1d2hWwOsgtlU-_CUQvz50_TczIvw1yE';

// DIAGNOSTIC: Check if env vars exist at runtime
const hasUrl = !!supabaseUrl;
const hasKey = !!supabaseAnonKey;
const url = supabaseUrl || 'MISSING';
const keyPreview = (supabaseAnonKey || '').slice(0, 6) + '...';
const source = 'hardcoded';

console.log('🔍 SUPABASE CONFIG DIAGNOSTIC:', {
  hasUrl,
  hasKey,
  url,
  keyPreview,
  source
});

export const DIAGNOSTIC_INFO = {
  hasUrl,
  hasKey,
  url,
  keyPreview,
  source
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
