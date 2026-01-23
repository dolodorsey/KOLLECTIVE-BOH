import { createClient, SupabaseClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.SUPABASE_URL || 'https://wfkohcwxxsrhcxhepfql.supabase.co';
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.SUPABASE_ANON_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Indma29oY3d4eHNyaGN4aGVwZnFsIiwicm9sZSI6ImFub24iLCJpYXQiOjE3MzU4NDk2MjYsImV4cCI6MjA1MTQyNTYyNn0.fXRLof3bExNH-YRiPo3TqhwyY-C2dGZ4dmuW1xIVqnY';

let supabaseInstance: SupabaseClient | null = null;

export function getBackendSupabase(): SupabaseClient {
  if (!supabaseInstance) {
    supabaseInstance = createClient(supabaseUrl, supabaseServiceKey, {
      auth: {
        autoRefreshToken: false,
        persistSession: false,
      },
    });
    console.log('🔧 [Backend] Supabase client created');
  }
  return supabaseInstance;
}
