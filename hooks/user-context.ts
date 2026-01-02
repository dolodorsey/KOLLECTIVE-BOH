import createContextHook from '@nkzw/create-context-hook';
import { useQuery } from '@tanstack/react-query';
import { useState, useEffect } from 'react';

import { User } from '@/types/user';
import { getSupabase, SUPABASE_CONFIG_OK } from '@/lib/supabase';

export const [UserContext, useUser] = createContextHook(() => {
  const [user, setUser] = useState<User | null>(null);

  const userQuery = useQuery({
    queryKey: ['user'],
    queryFn: async () => {
      if (!SUPABASE_CONFIG_OK) {
        console.error('❌ Supabase not configured in user context');
        throw new Error('Supabase not configured');
      }

      try {
        const supabase = getSupabase();
        const { data: { session }, error: sessionError } = await supabase.auth.getSession();

        if (sessionError) {
          console.error('❌ Error getting session:', sessionError);
          throw sessionError;
        }

        if (!session) {
          console.log('⚠️ No session found in user context');
          return null;
        }

        console.log('👤 Fetching user profile for:', session.user.id);
        const { data: profile, error: profileError } = await supabase
          .from('profiles')
          .select('*')
          .eq('id', session.user.id)
          .single();

        if (profileError) {
          console.error('❌ Error fetching profile:', profileError);
          throw profileError;
        }

        if (!profile) {
          console.error('❌ No profile found for user');
          throw new Error('Profile not found');
        }

        console.log('✅ User profile loaded:', profile.name);
        return profile as User;
      } catch (error) {
        console.error('❌ Error in user query:', error);
        throw error;
      }
    },
    enabled: SUPABASE_CONFIG_OK,
  });

  useEffect(() => {
    if (userQuery.data) {
      setUser(userQuery.data);
    }
  }, [userQuery.data]);

  return {
    user,
    isLoading: userQuery.isLoading,
    error: userQuery.error
  };
});