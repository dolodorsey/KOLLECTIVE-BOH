import React from "react";
export type OrgRole = 'owner' | 'admin' | 'manager' | 'staff';

export type EntityPermission = 'view' | 'edit' | 'manage';

export interface OrgMembership {
  org_id: string;
  user_id: string;
  role: OrgRole;
  status: 'active' | 'inactive' | 'pending';
  created_at?: string;
}

export interface EntityMembership {
  entity_id: string;
  user_id: string;
  role: string;
  permissions?: EntityPermission[];
  created_at?: string;
}

export interface Profile {
  id: string;
  email: string;
  full_name: string;
  avatar_url?: string;
  created_at: string;
  updated_at?: string;
}

export interface AuthState {
  session: any | null;
  userId: string | null;
  profile: Profile | null;
  activeOrgId: string | null;
  orgRole: OrgRole | null;
  orgMemberships: OrgMembership[];
  entityMemberships: EntityMembership[];
  isLoading: boolean;
  error: string | null;
}

export interface AccessGuardProps {
  allowOrgRoles?: OrgRole[];
  denyOrgRoles?: OrgRole[];
  requireEntityAccess?: string;
  fallback?: React.ReactNode;
  children: React.ReactNode;
}

export function isOwnerOrAdmin(role: OrgRole | null): boolean {
  return role === 'owner' || role === 'admin';
}

export function isManager(role: OrgRole | null): boolean {
  return role === 'manager';
}

export function isStaff(role: OrgRole | null): boolean {
  return role === 'staff';
}

export function hasOrgAccess(role: OrgRole | null, allowedRoles?: OrgRole[]): boolean {
  if (!role) return false;
  if (!allowedRoles || allowedRoles.length === 0) return true;
  return allowedRoles.includes(role);
}
