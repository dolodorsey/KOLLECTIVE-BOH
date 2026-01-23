import createContextHook from '@/lib/create-context-hook';
import { useEffect, useState, useRef } from 'react';
import { supabase } from '@/lib/supabase';
import type { Session } from '@supabase/supabase-js';
import type { OrgMembership, EntityMembership, Profile, OrgRole } from '@/types/rbac';

export const [AuthContext, useAuth] = createContextHook(() => {
  const [session, setSession] = useState<Session | null>(null);
  const [userId, setUserId] = useState<string | null>(null);
  const [profile, setProfile] = useState<Profile | null>(null);
  const [activeOrgId, setActiveOrgId] = useState<string | null>(null);
  const [orgRole, setOrgRole] = useState<OrgRole | null>(null);
  const [orgMemberships, setOrgMemberships] = useState<OrgMembership[]>([]);
  const [entityMemberships, setEntityMemberships] = useState<EntityMembership[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [timedOut, setTimedOut] = useState(false);
  const initStarted = useRef(false);

  const loadUserData = async (authSession: Session) => {
    try {
      setIsLoading(true);
      setError(null);

      const currentUserId = authSession.user.id;
      setUserId(currentUserId);

      console.log('🔐 Loading user data for:', currentUserId);

      const { data: profileData, error: profileError } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', currentUserId)
        .single();

      if (profileError) {
        if (profileError.code === 'PGRST116') {
          console.log('📝 Profile not found, auto-creating...');
          const { data: newProfile, error: createError } = await supabase
            .from('profiles')
            .insert({
              id: currentUserId,
              email: authSession.user.email || '',
              full_name: authSession.user.user_metadata?.full_name || authSession.user.email?.split('@')[0] || 'User',
              avatar_url: authSession.user.user_metadata?.avatar_url,
            })
            .select()
            .single();

          if (createError) {
            console.error('❌ Failed to create profile:', createError);
            throw createError;
          }

          console.log('✅ Profile created:', newProfile);
          setProfile(newProfile);
        } else {
          console.error('❌ Profile fetch error:', profileError);
          throw profileError;
        }
      } else {
        console.log('✅ Profile loaded:', profileData);
        setProfile(profileData);
      }

      const { data: orgMembersData, error: orgError } = await supabase
        .from('org_members')
        .select('*')
        .eq('user_id', currentUserId)
        .eq('status', 'active')
        .order('created_at', { ascending: true });

      if (orgError) {
        console.error('❌ Org members error:', orgError);
      } else {
        const memberships = (orgMembersData || []) as OrgMembership[];
        console.log('✅ Org memberships loaded:', memberships.length);
        setOrgMemberships(memberships);

        if (memberships.length > 0) {
          const firstOrg = memberships[0];
          setActiveOrgId(firstOrg.org_id);
          setOrgRole(firstOrg.role);
          console.log('🏢 Active org set:', firstOrg.org_id, '- Role:', firstOrg.role);
        } else {
          console.log('⚠️ No org memberships found');
          setActiveOrgId(null);
          setOrgRole(null);
        }
      }

      const { data: entityMembersData, error: entityError } = await supabase
        .from('entity_members')
        .select('*')
        .eq('user_id', currentUserId);

      if (entityError) {
        console.error('❌ Entity members error:', entityError);
      } else {
        const entities = (entityMembersData || []) as EntityMembership[];
        console.log('✅ Entity memberships loaded:', entities.length);
        setEntityMemberships(entities);
      }

    } catch (err: any) {
      console.error('💥 Auth context error:', err);
      setError(err.message || 'Failed to load user data');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    if (initStarted.current) return;
    initStarted.current = true;
    
    console.log('🚀 Auth context initializing...');

    const timeoutId = setTimeout(() => {
      console.warn('⏰ Auth initialization timed out after 8 seconds');
      setTimedOut(true);
      setIsLoading(false);
      setError('Authentication timed out. Please check your connection.');
    }, 8000);

    supabase.auth.getSession().then(({ data: { session: currentSession } }: { data: { session: Session | null } }) => {
      clearTimeout(timeoutId);
      console.log('📡 Current session:', currentSession ? 'Found' : 'None');
      setSession(currentSession);
      if (currentSession) {
        loadUserData(currentSession);
      } else {
        setIsLoading(false);
      }
    }).catch((err: Error) => {
      clearTimeout(timeoutId);
      console.error('❌ Failed to get session:', err);
      setError('Failed to initialize authentication');
      setIsLoading(false);
    });

    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      (_event: string, newSession: Session | null) => {
        console.log('🔄 Auth state changed:', _event);
        setSession(newSession);
        
        if (newSession) {
          loadUserData(newSession);
        } else {
          setUserId(null);
          setProfile(null);
          setActiveOrgId(null);
          setOrgRole(null);
          setOrgMemberships([]);
          setEntityMemberships([]);
          setIsLoading(false);
        }
      }
    );

    return () => {
      clearTimeout(timeoutId);
      subscription.unsubscribe();
    };
  }, []);

  const switchOrg = (orgId: string) => {
    const membership = orgMemberships.find(m => m.org_id === orgId);
    if (membership) {
      setActiveOrgId(orgId);
      setOrgRole(membership.role);
      console.log('🔄 Switched to org:', orgId, '- Role:', membership.role);
    }
  };

  const refetch = async () => {
    if (session) {
      await loadUserData(session);
    }
  };

  const hasEntityAccess = (entityId: string): boolean => {
    if (orgRole === 'owner' || orgRole === 'admin') return true;
    return entityMemberships.some(em => em.entity_id === entityId);
  };

  return {
    session,
    userId,
    profile,
    activeOrgId,
    orgRole,
    orgMemberships,
    entityMemberships,
    isLoading,
    error,
    timedOut,
    switchOrg,
    refetch,
    hasEntityAccess,
  };
});
