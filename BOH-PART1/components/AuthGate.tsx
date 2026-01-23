import React from 'react';
import { View, Text, StyleSheet, ActivityIndicator, TouchableOpacity } from 'react-native';
import { Redirect, useRouter } from 'expo-router';
import { useAuth } from '@/hooks/auth-context';
import { isOwnerOrAdmin } from '@/types/rbac';
import { AlertTriangle, RefreshCw } from 'lucide-react-native';

export default function AuthGate({ children }: { children: React.ReactNode }) {
  const { session, userId, profile, orgMemberships, activeOrgId, orgRole, isLoading, error, timedOut, refetch } = useAuth();
  const router = useRouter();

  console.log('🚪 AuthGate check:', {
    hasSession: !!session,
    userId,
    hasProfile: !!profile,
    orgCount: orgMemberships.length,
    activeOrgId,
    orgRole,
    isLoading,
  });

  if (isLoading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#FFD700" />
        <Text style={styles.loadingText}>Processing the vision...</Text>
        <Text style={styles.loadingSubtext}>Initializing authentication...</Text>
      </View>
    );
  }

  if (timedOut || error) {
    return (
      <View style={styles.errorContainer}>
        <AlertTriangle size={48} color="#FF6B6B" />
        <Text style={styles.errorTitle}>Connection Issue</Text>
        <Text style={styles.errorMessage}>{error || 'Authentication timed out'}</Text>
        <View style={styles.errorActions}>
          <TouchableOpacity style={styles.retryButton} onPress={() => refetch()}>
            <RefreshCw size={18} color="#000" />
            <Text style={styles.retryButtonText}>Retry</Text>
          </TouchableOpacity>
          <TouchableOpacity style={styles.loginButton} onPress={() => router.replace('/auth/login')}>
            <Text style={styles.loginButtonText}>Go to Login</Text>
          </TouchableOpacity>
        </View>
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
      <View style={styles.profileErrorContainer}>
        <ActivityIndicator size="large" color="#FFD700" />
        <Text style={styles.profileErrorText}>Recalibrating the blueprint...</Text>
        <Text style={styles.profileErrorSubtext}>Profile initialization in progress</Text>
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
    gap: 12,
  },
  loadingText: {
    fontSize: 18,
    fontWeight: '600' as const,
    color: '#FFD700',
    marginTop: 16,
  },
  loadingSubtext: {
    fontSize: 14,
    color: '#888',
  },
  errorContainer: {
    flex: 1,
    backgroundColor: '#121212',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 24,
    gap: 16,
  },
  errorTitle: {
    fontSize: 22,
    fontWeight: '700' as const,
    color: '#FF6B6B',
    marginTop: 8,
  },
  errorMessage: {
    fontSize: 14,
    color: '#999',
    textAlign: 'center',
    maxWidth: 280,
  },
  errorActions: {
    flexDirection: 'row',
    gap: 12,
    marginTop: 24,
  },
  retryButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFD700',
    paddingHorizontal: 20,
    paddingVertical: 12,
    borderRadius: 8,
    gap: 8,
  },
  retryButtonText: {
    fontSize: 16,
    fontWeight: '600' as const,
    color: '#000',
  },
  loginButton: {
    alignItems: 'center',
    backgroundColor: 'transparent',
    borderWidth: 1,
    borderColor: '#555',
    paddingHorizontal: 20,
    paddingVertical: 12,
    borderRadius: 8,
  },
  loginButtonText: {
    fontSize: 16,
    fontWeight: '600' as const,
    color: '#fff',
  },
  profileErrorContainer: {
    flex: 1,
    backgroundColor: '#121212',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 24,
  },
  profileErrorText: {
    fontSize: 18,
    fontWeight: '700' as const,
    color: '#FFD700',
    marginBottom: 8,
    textAlign: 'center',
  },
  profileErrorSubtext: {
    fontSize: 14,
    color: '#999',
    textAlign: 'center',
  },
});
