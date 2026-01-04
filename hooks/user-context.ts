import createContextHook from '@nkzw/create-context-hook';
import { useEffect, useState } from 'react';
import { supabase } from '@/lib/supabase';
import type { User as SupabaseUser, Session } from '@supabase/supabase-js';

import { User } from '@/types/user';

type Profile = {
  id: string;
  email: string;
  full_name: string;
  avatar_url?: string;
  created_at: string;
};

type OrgMember = {
  org_id: string;
  user_id: string;
  role: string;
  status: string;
};

type EntityMember = {
  entity_id: string;
  user_id: string;
  role: string;
};

export const [UserContext, useUser] = createContextHook(() => {
  const [user, setUser] = useState<User | null>(null);
  const [profile, setProfile] = useState<Profile | null>(null);
  const [orgMemberships, setOrgMemberships] = useState<OrgMember[]>([]);
  const [entityMemberships, setEntityMemberships] = useState<EntityMember[]>([]);
  const [activeOrgId, setActiveOrgId] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Load user profile, org memberships, and entity access
  const fetchUserData = async (authUser: SupabaseUser) => {
    try {
      setIsLoading(true);
      setError(null);

      // Fetch user profile
      const { data: profileData, error: profileError } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', authUser.id)
        .single();

      if (profileError) {
        console.error('Profile error:', profileError);
        setError('Failed to load user profile');
        return;
      }

      setProfile(profileData);

      // Fetch org memberships
      const { data: orgMembers, error: orgError } = await supabase
        .from('org_members')
        .select('*')
        .eq('user_id', authUser.id)
        .eq('status', 'active');

      if (orgError) {
        console.error('Org members error:', orgError);
      } else {
        setOrgMemberships(orgMembers || []);
        // Set first active org as default
        if (orgMembers && orgMembers.length > 0) {
          setActiveOrgId(orgMembers[0].org_id);
        }
      }

      // Fetch entity memberships (entity-level access control)
      const { data: entityMembers, error: entityError } = await supabase
        .from('entity_members')
        .select('*')
        .eq('user_id', authUser.id);

      if (entityError) {
        console.error('Entity members error:', entityError);
      } else {
        setEntityMemberships(entityMembers || []);
      }

      // Map to User type
      const userData: User = {
        id: authUser.id,
        email: authUser.email || profileData.email,
        name: profileData.full_name,
        profileImage: profileData.avatar_url,
        role: orgMembers && orgMembers.length > 0 ? orgMembers[0].role : 'staff',
        assignedBrands: [],
        xp: 0,
      };

      setUser(userData);
    } catch (err: any) {
      console.error('User data fetch error:', err);
      setError(err.message || 'Failed to load user data');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    // Check current session
    supabase.auth.getSession().then(({ data: { session } }: { data: { session: Session | null } }) => {
      if (session?.user) {
        fetchUserData(session.user);
      } else {
        setIsLoading(false);
      }
    });

    // Listen for auth changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      (_event: string, session: Session | null) => {
        if (session?.user) {
          fetchUserData(session.user);
        } else {
          setUser(null);
          setProfile(null);
          setOrgMemberships([]);
          setEntityMemberships([]);
          setActiveOrgId(null);
          setIsLoading(false);
        }
      }
    );

    return () => {
      subscription.unsubscribe();
    };
  }, []);

  return {
    user,
    profile,
    orgMemberships,
    entityMemberships,
    activeOrgId,
    setActiveOrgId,
    isLoading,
    error,
    refetch: () => {
      supabase.auth.getSession().then(({ data: { session } }: { data: { session: Session | null } }) => {
        if (session?.user) {
          fetchUserData(session.user);
        }
      });
    },
  };
});
