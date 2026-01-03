import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  ScrollView,
  StyleSheet,
  RefreshControl,
  ActivityIndicator,
  TouchableOpacity,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import { getSupabase } from '@/lib/supabase';
import { Users, Building2, CheckSquare, TrendingUp } from 'lucide-react-native';

interface DashboardStats {
  totalEntities: number;
  totalTeamMembers: number;
  activeTasks: number;
  completionRate: number;
}

export default function OwnerPortalScreen() {
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [stats, setStats] = useState<DashboardStats>({
    totalEntities: 0,
    totalTeamMembers: 0,
    activeTasks: 0,
    completionRate: 0,
  });
  const [orgName, setOrgName] = useState('Your Organization');

  useEffect(() => {
    loadDashboardData();
  }, []);

  const loadDashboardData = async () => {
    try {
      const supabase = getSupabase();
      
      // Get current user
      const { data: { user }, error: userError } = await supabase.auth.getUser();
      if (userError || !user) return;

      // Get user's organization
      const { data: orgs } = await supabase
        .from('orgs')
        .select('id, name')
        .eq('created_by', user.id)
        .limit(1)
        .single();

      if (orgs) {
        setOrgName(orgs.name);
        const orgId = orgs.id;

        // Get total entities (brands + locations)
        const { data: entities, error: entitiesError } = await supabase
          .from('entities')
          .select('id')
          .eq('org_id', orgId);

        // Get team members count
        const { data: profiles, error: profilesError } = await supabase
          .from('profiles')
          .select('id')
          .eq('org_id', orgId);

        // Get active tasks
        const { data: tasks, error: tasksError } = await supabase
          .from('tasks')
          .select('id, status')
          .eq('org_id', orgId);

        const activeTasks = tasks?.filter(t => t.status !== 'completed').length || 0;
        const completedTasks = tasks?.filter(t => t.status === 'completed').length || 0;
        const totalTasks = tasks?.length || 0;
        const completionRate = totalTasks > 0 ? (completedTasks / totalTasks) * 100 : 0;

        setStats({
          totalEntities: entities?.length || 0,
          totalTeamMembers: profiles?.length || 0,
          activeTasks,
          completionRate: Math.round(completionRate),
        });
      }
    } catch (error) {
      console.error('Failed to load dashboard data:', error);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  const onRefresh = () => {
    setRefreshing(true);
    loadDashboardData();
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
            <Text style={styles.headerTitle}>Owner Portal</Text>
            <Text style={styles.headerSubtitle}>{orgName}</Text>
          </View>

          <ScrollView
            style={styles.scrollView}
            contentContainerStyle={styles.scrollContent}
            refreshControl={
              <RefreshControl
                refreshing={refreshing}
                onRefresh={onRefresh}
                tintColor="#FFD700"
              />
            }
          >
            <View style={styles.statsGrid}>
              <View style={styles.statCard}>
                <View style={styles.statIconContainer}>
                  <Building2 size={24} color="#FFD700" />
                </View>
                <Text style={styles.statValue}>{stats.totalEntities}</Text>
                <Text style={styles.statLabel}>Total Entities</Text>
                <Text style={styles.statDescription}>Brands & Locations</Text>
              </View>

              <View style={styles.statCard}>
                <View style={styles.statIconContainer}>
                  <Users size={24} color="#FFD700" />
                </View>
                <Text style={styles.statValue}>{stats.totalTeamMembers}</Text>
                <Text style={styles.statLabel}>Team Members</Text>
                <Text style={styles.statDescription}>Active users</Text>
              </View>

              <View style={styles.statCard}>
                <View style={styles.statIconContainer}>
                  <CheckSquare size={24} color="#FFD700" />
                </View>
                <Text style={styles.statValue}>{stats.activeTasks}</Text>
                <Text style={styles.statLabel}>Active Tasks</Text>
                <Text style={styles.statDescription}>In progress</Text>
              </View>

              <View style={styles.statCard}>
                <View style={styles.statIconContainer}>
                  <TrendingUp size={24} color="#FFD700" />
                </View>
                <Text style={styles.statValue}>{stats.completionRate}%</Text>
                <Text style={styles.statLabel}>Completion</Text>
                <Text style={styles.statDescription}>Overall rate</Text>
              </View>
            </View>

            <View style={styles.section}>
              <Text style={styles.sectionTitle}>Quick Actions</Text>
              <TouchableOpacity style={styles.actionButton}>
                <Text style={styles.actionButtonText}>View Team Activity</Text>
              </TouchableOpacity>
              <TouchableOpacity style={styles.actionButton}>
                <Text style={styles.actionButtonText}>Manage Entities</Text>
              </TouchableOpacity>
              <TouchableOpacity style={styles.actionButton}>
                <Text style={styles.actionButtonText}>Review Tasks</Text>
              </TouchableOpacity>
            </View>
          </ScrollView>
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
    paddingBottom: 16,
  },
  headerTitle: {
    fontSize: 32,
    fontWeight: '800',
    color: '#FFD700',
    marginBottom: 4,
  },
  headerSubtitle: {
    fontSize: 16,
    color: '#999',
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    padding: 24,
    paddingTop: 0,
  },
  statsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    marginHorizontal: -6,
    marginBottom: 24,
  },
  statCard: {
    width: '48%',
    backgroundColor: '#1a1a1a',
    borderRadius: 16,
    padding: 16,
    margin: '1%',
    borderWidth: 1,
    borderColor: 'rgba(255, 215, 0, 0.2)',
  },
  statIconContainer: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: 'rgba(255, 215, 0, 0.1)',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 12,
  },
  statValue: {
    fontSize: 28,
    fontWeight: '800',
    color: '#fff',
    marginBottom: 4,
  },
  statLabel: {
    fontSize: 14,
    fontWeight: '600',
    color: '#FFD700',
    marginBottom: 4,
  },
  statDescription: {
    fontSize: 12,
    color: '#666',
  },
  section: {
    marginTop: 8,
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: '#FFD700',
    marginBottom: 16,
  },
  actionButton: {
    backgroundColor: '#1a1a1a',
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: '#333',
  },
  actionButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#fff',
  },
});
