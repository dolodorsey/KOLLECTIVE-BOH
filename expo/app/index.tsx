import React, { useEffect } from 'react';
import { View, Text, StyleSheet, ActivityIndicator } from 'react-native';
import { Redirect } from 'expo-router';
import { useAuth } from '@/hooks/auth-context';
import { isOwnerOrAdmin } from '@/types/rbac';

export default function Index() {
  const { session, userId, profile, orgMemberships, activeOrgId, orgRole, isLoading } = useAuth();

  useEffect(() => {
    console.log('🏠 Index route - auth state:', {
      hasSession: !!session,
      userId,
      hasProfile: !!profile,
      orgCount: orgMemberships.length,
      activeOrgId,
      orgRole,
      isLoading,
    });
  }, [session, userId, profile, orgMemberships, activeOrgId, orgRole, isLoading]);

  if (isLoading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#FFD700" />
        <Text style={styles.loadingText}>Processing the vision...</Text>
      </View>
    );
  }

  if (!session || !userId) {
    console.log('🔒 No session, redirecting to login');
    return <Redirect href="/auth/login" />;
  }

  if (!profile) {
    console.log('⚠️ No profile found');
    return (
      <View style={styles.errorContainer}>
        <Text style={styles.errorText}>Recalibrating the blueprint...</Text>
        <Text style={styles.errorSubtext}>Profile initialization in progress</Text>
      </View>
    );
  }

  if (orgMemberships.length === 0) {
    console.log('🏢 No org membership, showing workspace setup');
    return <Redirect href="/auth/gate" />;
  }

  if (!activeOrgId || !orgRole) {
    console.log('❌ Missing active org or role');
    return <Redirect href="/auth/gate" />;
  }

  if (isOwnerOrAdmin(orgRole)) {
    console.log('👑 Owner/Admin access - routing to owner portal');
    return <Redirect href="/(owner)/dashboard" />;
  } else {
    console.log('👷 Staff/Manager access - routing to team app');
    return <Redirect href="/(team)/tasks" />;
  }
}

const styles = StyleSheet.create({
  loadingContainer: {
    flex: 1,
    backgroundColor: '#121212',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 16,
  },
  loadingText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#FFD700',
  },
  errorContainer: {
    flex: 1,
    backgroundColor: '#121212',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 24,
  },
  errorText: {
    fontSize: 18,
    fontWeight: '700',
    color: '#FFD700',
    marginBottom: 8,
    textAlign: 'center',
  },
  errorSubtext: {
    fontSize: 14,
    color: '#999',
    textAlign: 'center',
  },
});
