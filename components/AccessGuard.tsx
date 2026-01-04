import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { useAuth } from '@/hooks/auth-context';
import type { OrgRole } from '@/types/rbac';

interface AccessGuardProps {
  allowOrgRoles?: OrgRole[];
  denyOrgRoles?: OrgRole[];
  requireEntityAccess?: string;
  fallback?: React.ReactNode;
  children: React.ReactNode;
}

export default function AccessGuard({
  allowOrgRoles,
  denyOrgRoles,
  requireEntityAccess,
  fallback,
  children,
}: AccessGuardProps) {
  const { orgRole, hasEntityAccess } = useAuth();

  console.log('🛡️ AccessGuard check:', {
    orgRole,
    allowOrgRoles,
    denyOrgRoles,
    requireEntityAccess,
  });

  if (denyOrgRoles && orgRole && denyOrgRoles.includes(orgRole)) {
    console.log('❌ Access denied - role in deny list');
    return fallback || <PermissionDenied />;
  }

  if (allowOrgRoles && allowOrgRoles.length > 0) {
    if (!orgRole || !allowOrgRoles.includes(orgRole)) {
      console.log('❌ Access denied - role not in allow list');
      return fallback || <PermissionDenied />;
    }
  }

  if (requireEntityAccess) {
    if (!hasEntityAccess(requireEntityAccess)) {
      console.log('❌ Access denied - no entity access');
      return fallback || <PermissionDenied />;
    }
  }

  console.log('✅ Access granted');
  return <>{children}</>;
}

function PermissionDenied() {
  return (
    <View style={styles.container}>
      <Text style={styles.title}>Access Restricted</Text>
      <Text style={styles.subtitle}>
        You don&apos;t have permission to view this area.
      </Text>
      <Text style={styles.hint}>
        Contact your administrator if you believe this is an error.
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#121212',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 24,
  },
  title: {
    fontSize: 24,
    fontWeight: '700',
    color: '#FFD700',
    marginBottom: 12,
  },
  subtitle: {
    fontSize: 16,
    color: '#999',
    textAlign: 'center',
    marginBottom: 8,
  },
  hint: {
    fontSize: 14,
    color: '#666',
    textAlign: 'center',
  },
});
