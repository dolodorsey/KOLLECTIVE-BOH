import 'react-native-url-polyfill/auto';
import { createClient, SupabaseClient } from '@supabase/supabase-js';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Platform } from 'react-native';

const supabaseUrl = process.env.EXPO_PUBLIC_SUPABASE_URL || '';
const supabaseAnonKey = process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY || '';

// DIAGNOSTIC: Check if env vars exist at runtime
const hasUrl = !!supabaseUrl;
const hasKey = !!supabaseAnonKey;
const url = supabaseUrl || 'MISSING';
const keyPreview = (supabaseAnonKey || '').slice(0, 6) + '...';
const source = 'environment';

console.log('🔍 [Supabase] CONFIG DIAGNOSTIC:', {
  hasUrl,
  hasKey,
  url,
  keyPreview,
  source
});

if (url.startsWith('http://')) {
  console.warn('⚠️ [Supabase] Using HTTP instead of HTTPS. iOS will block these requests.');
}

if (!hasUrl || !hasKey) {
  console.error('❌ [Supabase] Missing configuration!');
}

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
    const storageAdapter = Platform.OS === 'web' ? undefined : AsyncStorage;
    
    supabaseInstance = createClient(supabaseUrl!, supabaseAnonKey!, {
      auth: {
        storage: storageAdapter,
        autoRefreshToken: true,
        persistSession: Platform.OS !== 'web',
        detectSessionInUrl: Platform.OS === 'web',
      },
    });
    
    console.log('🔧 [Supabase] Client created with storage:', Platform.OS === 'web' ? 'localStorage (default)' : 'AsyncStorage');
  }

  return supabaseInstance;
}

export const supabase = SUPABASE_CONFIG_OK ? getSupabase() : (null as any);
