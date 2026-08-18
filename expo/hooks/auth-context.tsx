import createContextHook from '@/lib/create-context-hook';
import { useEffect, useState, useRef } from 'react';
import { supabase } from '@/lib/supabase';
import type { Session } from '@supabase/supabase-js';
import type { OrgMembership, EntityMembership, Profile, OrgRole, EntityPermission } from '@/types/rbac';

function permissionsForAccessLevel(accessLevel: string): EntityPermission[] {
  switch (accessLevel) {
    case 'owner':
    case 'manager':
      return ['view', 'edit', 'manage'];
    case 'approver':
      return ['view', 'edit'];
    case 'operator':
      return ['view', 'edit'];
    default:
      return ['view'];
  }
}

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

      const { data: profileData, error: profileError } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', currentUserId)
        .single();

      if (profileError) {
        if (profileError.code === 'PGRST116') {
          const { data: newProfile, error: createError } = await supabase
            .from('profiles')
            .insert({
              id: currentUserId,
              email: authSession.user.email || '',
              full_name:
                authSession.user.user_metadata?.full_name ||
                authSession.user.email?.split('@')[0] ||
                'User',
              avatar_url: authSession.user.user_metadata?.avatar_url,
            })
            .select()
            .single();
          if (createError) throw createError;
          setProfile(newProfile);
        } else {
          throw profileError;
        }
      } else {
        setProfile(profileData);
      }

      const { data: orgMembersData, error: orgError } = await supabase
        .from('org_members')
        .select('*')
        .eq('user_id', currentUserId)
        .eq('status', 'active')
        .order('created_at', { ascending: true });

      if (orgError) {
        console.error('Org membership load failed:', orgError);
        setOrgMemberships([]);
        setActiveOrgId(null);
        setOrgRole(null);
      } else {
        const memberships = (orgMembersData || []) as OrgMembership[];
        setOrgMemberships(memberships);
        const firstOrg = memberships[0];
        setActiveOrgId(firstOrg?.org_id || null);
        setOrgRole(firstOrg?.role || null);
      }

      // Current entity access source of truth. The legacy `entity_members`
      // relation is retired from the app data path.
      const { data: assignmentsData, error: assignmentError } = await supabase
        .from('company_team_assignments')
        .select('entity_id,user_id,company_role,access_level,status,created_at')
        .eq('user_id', currentUserId)
        .eq('status', 'active');

      if (assignmentError) {
        console.error('Company assignments load failed:', assignmentError);
        setEntityMemberships([]);
      } else {
        const mapped: EntityMembership[] = (assignmentsData || []).map((assignment: any) => ({
          entity_id: assignment.entity_id,
          user_id: assignment.user_id,
          role: assignment.company_role,
          access_level: assignment.access_level,
          permissions: permissionsForAccessLevel(assignment.access_level),
          created_at: assignment.created_at,
        }));
        setEntityMemberships(mapped);
      }
    } catch (err: any) {
      console.error('Auth context error:', err);
      setError(err.message || 'Failed to load user data');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    if (initStarted.current) return;
    initStarted.current = true;

    const timeoutId = setTimeout(() => {
      setTimedOut(true);
      setIsLoading(false);
      setError('Authentication timed out. Please check your connection.');
    }, 8000);

    supabase.auth
      .getSession()
      .then(({ data: { session: currentSession } }: { data: { session: Session | null } }) => {
        clearTimeout(timeoutId);
        setSession(currentSession);
        if (currentSession) loadUserData(currentSession);
        else setIsLoading(false);
      })
      .catch(() => {
        clearTimeout(timeoutId);
        setError('Failed to initialize authentication');
        setIsLoading(false);
      });

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event: string, newSession: Session | null) => {
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
    });

    return () => {
      clearTimeout(timeoutId);
      subscription.unsubscribe();
    };
  }, []);

  const switchOrg = (orgId: string) => {
    const membership = orgMemberships.find((item) => item.org_id === orgId);
    if (membership) {
      setActiveOrgId(orgId);
      setOrgRole(membership.role);
    }
  };

  const refetch = async () => {
    if (session) await loadUserData(session);
  };

  const hasEntityAccess = (entityId: string): boolean => {
    if (orgRole === 'owner' || orgRole === 'admin') return true;
    return entityMemberships.some((membership) => membership.entity_id === entityId);
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
