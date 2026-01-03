import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  StyleSheet,
  ActivityIndicator,
  Alert,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import { useRouter } from 'expo-router';
import { getSupabase } from '@/lib/supabase';
import { Building2, ChevronRight, Shield } from 'lucide-react-native';

interface Organization {
  id: string;
  name: string;
  created_by: string;
}

export default function AuthGateScreen() {
  const router = useRouter();
  const [user, setUser] = useState<any>(null);
  const [organizations, setOrganizations] = useState<Organization[]>([]);
  const [loading, setLoading] = useState(true);
  const [selecting, setSelecting] = useState(false);

  useEffect(() => {
    checkAuth();
  }, []);

  const checkAuth = async () => {
    try {
      const supabase = getSupabase();
      const { data: { user }, error } = await supabase.auth.getUser();

      if (error || !user) {
        router.replace('/auth/login');
        return;
      }

      setUser(user);
      await loadOrganizations(user.id);
    } catch (error) {
      console.error('Auth check error:', error);
      router.replace('/auth/login');
    }
  };

  const loadOrganizations = async (userId: string) => {
    try {
      const supabase = getSupabase();
      
      // Get all organizations where user is owner
      const { data: orgs, error } = await supabase
        .from('orgs')
        .select('id, name, created_by')
        .eq('created_by', userId);

      if (error) throw error;

      setOrganizations(orgs || []);
    } catch (error) {
      console.error('Failed to load organizations:', error);
      Alert.alert('Error', 'Failed to load your organizations');
    } finally {
      setLoading(false);
    }
  };

  const selectOrganization = async (org: Organization) => {
    setSelecting(true);
    try {
      // Store selected org in context/state
      // Navigate to owner portal
      router.replace('/(tabs)');
    } catch (error) {
      console.error('Failed to select organization:', error);
      Alert.alert('Error', 'Failed to select organization');
    } finally {
      setSelecting(false);
    }
  };

  const handleLogout = async () => {
    try {
      const supabase = getSupabase();
      await supabase.auth.signOut();
      router.replace('/auth/login');
    } catch (error) {
      console.error('Logout error:', error);
    }
  };

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#FFD700" />
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <LinearGradient
        colors={['#0a0a0a', '#121212', '#1a1a1a']}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={styles.gradient}
      >
        <SafeAreaView style={styles.safeArea}>
          <View style={styles.header}>
            <View style={styles.logoContainer}>
              <View style={styles.logoCircle}>
                <Shield size={32} color="#FFD700" strokeWidth={2.5} />
              </View>
            </View>
            <Text style={styles.title}>Select Organization</Text>
            <Text style={styles.subtitle}>
              {user?.email || 'Choose an organization to continue'}
            </Text>
          </View>

          <ScrollView 
            style={styles.scrollView}
            contentContainerStyle={styles.scrollContent}
          >
            {organizations.length === 0 ? (
              <View style={styles.emptyState}>
                <Text style={styles.emptyText}>No organizations found</Text>
                <Text style={styles.emptySubtext}>
                  Contact your administrator to get access
                </Text>
              </View>
            ) : (
              organizations.map((org) => (
                <TouchableOpacity
                  key={org.id}
                  style={styles.orgCard}
                  onPress={() => selectOrganization(org)}
                  disabled={selecting}
                  activeOpacity={0.8}
                >
                  <View style={styles.orgIconContainer}>
                    <Building2 size={28} color="#FFD700" />
                  </View>
                  <View style={styles.orgInfo}>
                    <Text style={styles.orgName}>{org.name}</Text>
                    <Text style={styles.orgId}>ID: {org.id.slice(0, 8)}...</Text>
                  </View>
                  <ChevronRight size={24} color="#666" />
                </TouchableOpacity>
              ))
            )}
          </ScrollView>

          <View style={styles.footer}>
            <TouchableOpacity
              style={styles.logoutButton}
              onPress={handleLogout}
            >
              <Text style={styles.logoutText}>Sign Out</Text>
            </TouchableOpacity>
          </View>
        </SafeAreaView>
      </LinearGradient>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  gradient: {
    flex: 1,
  },
  safeArea: {
    flex: 1,
  },
  loadingContainer: {
    flex: 1,
    backgroundColor: '#121212',
    alignItems: 'center',
    justifyContent: 'center',
  },
  header: {
    padding: 24,
    alignItems: 'center',
  },
  logoContainer: {
    marginBottom: 16,
  },
  logoCircle: {
    width: 64,
    height: 64,
    borderRadius: 32,
    backgroundColor: 'rgba(255, 215, 0, 0.15)',
    borderWidth: 2,
    borderColor: 'rgba(255, 215, 0, 0.3)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  title: {
    fontSize: 28,
    fontWeight: '800',
    color: '#FFD700',
    marginBottom: 8,
  },
  subtitle: {
    fontSize: 14,
    color: '#999',
    textAlign: 'center',
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    padding: 24,
  },
  emptyState: {
    alignItems: 'center',
    paddingVertical: 48,
  },
  emptyText: {
    fontSize: 18,
    fontWeight: '600',
    color: '#666',
    marginBottom: 8,
  },
  emptySubtext: {
    fontSize: 14,
    color: '#555',
  },
  orgCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#1a1a1a',
    borderRadius: 16,
    padding: 16,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: 'rgba(255, 215, 0, 0.2)',
  },
  orgIconContainer: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: 'rgba(255, 215, 0, 0.1)',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  orgInfo: {
    flex: 1,
  },
  orgName: {
    fontSize: 16,
    fontWeight: '600',
    color: '#fff',
    marginBottom: 4,
  },
  orgId: {
    fontSize: 12,
    color: '#666',
  },
  footer: {
    padding: 24,
    borderTopWidth: 1,
    borderTopColor: '#222',
  },
  logoutButton: {
    padding: 16,
    borderRadius: 12,
    backgroundColor: '#1a1a1a',
    borderWidth: 1,
    borderColor: '#333',
    alignItems: 'center',
  },
  logoutText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#888',
  },
});
