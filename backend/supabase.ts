import { createClient, SupabaseClient } from '@supabase/supabase-js';

const supabaseUrl = 'https://wfkohcwxxsrhcxhepfql.supabase.co';
const supabaseAnonKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Indma29oY3d4eHNyaGN4aGVwZnFsIiwicm9sZSI6ImFub24iLCJpYXQiOjE3MzU4NDk2MjYsImV4cCI6MjA1MTQyNTYyNn0.fXRLof3bExNH-YRiPo3TqhwyY-C2dGZ4dmuW1xIVqnY';

let supabaseInstance: SupabaseClient | null = null;

export function getSupabase(): SupabaseClient {
  if (!supabaseUrl || !supabaseAnonKey) {
    throw new Error('Supabase configuration missing');
  }

  if (!supabaseInstance) {
    supabaseInstance = createClient(supabaseUrl, supabaseAnonKey, {
      auth: {
        autoRefreshToken: false,
        persistSession: false,
      },
    });
    console.log('🔧 [Backend Supabase] Client created');
  }

  return supabaseInstance;
}

export const supabase = getSupabase();
