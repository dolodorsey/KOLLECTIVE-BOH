import createContextHook from '@nkzw/create-context-hook';
import { useQuery } from '@tanstack/react-query';
import { useState, useEffect } from 'react';

import { User } from '@/types/user';
import { getSupabase, SUPABASE_CONFIG_OK } from '@/lib/supabase';

export const [UserContext, useUser] = createContextHook(() => {
  const [user, setUser] = useState<User | null>(null);

  const userQuery = useQuery({
    queryKey: ['user'],
    enabled: false,
    queryFn: async () => {
      try {
        if (!SUPABASE_CONFIG_OK) {
          console.error('❌ Supabase not configured in user context');
          return null;
        }

        const supabase = getSupabase();
        
        const { data: { session }, error: sessionError } = await supabase.auth.getSession();

        if (sessionError) {
          console.error('❌ Supabase error getting session:', sessionError.message || sessionError);
          return null;
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
          .maybeSingle();

        if (profileError) {
          console.error('❌ Supabase error fetching profile:', profileError.message || profileError);
          return null;
        }

        if (!profile) {
          console.warn('⚠️ No profile found for user');
          return null;
        }

        console.log('✅ User profile loaded:', profile.name);
        
        const userProfile: User = {
          id: profile.id,
          name: profile.name || 'User',
          role: profile.role || 'Ops / VA',
          rank: profile.rank,
          assignedBrands: Array.isArray(profile.assignedBrands) 
            ? profile.assignedBrands 
            : (profile.assigned_brands ? (Array.isArray(profile.assigned_brands) ? profile.assigned_brands : []) : []),
          xp: profile.xp || 0,
          profileImage: profile.profileImage || profile.profile_image,
        };
        
        return userProfile;
      } catch (error) {
        console.error('❌ Network/fetch error in user query:', error);
        return null;
      }
    },
    retry: false,
    staleTime: 30000,
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