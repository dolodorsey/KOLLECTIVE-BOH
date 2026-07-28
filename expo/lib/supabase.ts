import 'react-native-url-polyfill/auto';
import { createClient, SupabaseClient } from '@supabase/supabase-js';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Platform } from 'react-native';

function getEnvVars() {
  const url = process.env.EXPO_PUBLIC_SUPABASE_URL || '';
  const key = process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY || '';
  return { url, key };
}

export function getDiagnosticInfo() {
  const { url, key } = getEnvVars();
  return {
    hasUrl: !!url,
    hasKey: !!key,
    url: url || 'MISSING',
    keyPreview: key ? key.slice(0, 20) + '...' : 'MISSING',
    source: 'environment'
  };
}

export function isSupabaseConfigured(): boolean {
  const { url, key } = getEnvVars();
  return !!(url && key);
}

export const SUPABASE_CONFIG_OK = true;

let supabaseInstance: SupabaseClient | null = null;
// The boh client carries a different schema generic than the public one.
let bohInstance: SupabaseClient<any, any, any> | null = null;
let lastUrl: string = '';
let lastKey: string = '';

export function getSupabase(): SupabaseClient {
  const { url, key } = getEnvVars();
  
  if (!url || !key) {
    console.error('❌ [Supabase] Missing configuration!', getDiagnosticInfo());
    throw new Error(
      'Supabase configuration missing. Please set EXPO_PUBLIC_SUPABASE_URL and EXPO_PUBLIC_SUPABASE_ANON_KEY.'
    );
  }

  if (!supabaseInstance || url !== lastUrl || key !== lastKey) {
    console.log('🔧 [Supabase] Creating client with:', {
      url,
      keyPreview: key.slice(0, 20) + '...'
    });
    
    const storageAdapter = Platform.OS === 'web' ? undefined : AsyncStorage;
    
    supabaseInstance = createClient(url, key, {
      auth: {
        storage: storageAdapter,
        autoRefreshToken: true,
        persistSession: Platform.OS !== 'web',
        detectSessionInUrl: Platform.OS === 'web',
      },
    });

    // Same session, scoped to the `boh` schema in the gateway project.
    // That schema maps this app onto live enterprise data — 129 entities,
    // 2,885 agents, the real task queue — instead of the empty tables the
    // app used to read. See BOH-DATA-INTEGRATION.md.
    bohInstance = createClient(url, key, {
      auth: {
        storage: storageAdapter,
        autoRefreshToken: true,
        persistSession: Platform.OS !== 'web',
        detectSessionInUrl: Platform.OS === 'web',
      },
      db: { schema: 'boh' },
    });
    
    lastUrl = url;
    lastKey = key;
    
    console.log('✅ [Supabase] Client created successfully');
  }

  return supabaseInstance;
}

/** Client scoped to the `boh` schema (live enterprise data). */
export function getBoh(): SupabaseClient<any, any, any> {
  getSupabase();
  if (!bohInstance) {
    throw new Error('BOH client not initialised — check Supabase configuration.');
  }
  return bohInstance;
}

/** The signed-in user's BOH roster record, or null if they are not on it. */
export async function getCurrentMember() {
  const { data, error } = await getSupabase().rpc('current_member');
  if (error) {
    console.error('[BOH] current_member failed:', error.message);
    return null;
  }
  return data ?? null;
}

export const supabase = {
  get auth() {
    return getSupabase().auth;
  },
  get from() {
    return getSupabase().from.bind(getSupabase());
  },
  get rpc() {
    return getSupabase().rpc.bind(getSupabase());
  },
  get storage() {
    return getSupabase().storage;
  },
  get functions() {
    return getSupabase().functions;
  },
  get realtime() {
    return getSupabase().realtime;
  },
  get channel() {
    return getSupabase().channel.bind(getSupabase());
  },
  get removeChannel() {
    return getSupabase().removeChannel.bind(getSupabase());
  },
  get removeAllChannels() {
    return getSupabase().removeAllChannels.bind(getSupabase());
  },
  get getChannels() {
    return getSupabase().getChannels.bind(getSupabase());
  }
};
