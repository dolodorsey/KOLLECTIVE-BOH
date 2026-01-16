import React from 'react';
import { View, Text, StyleSheet, ScrollView } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useAuth } from '@/hooks/auth-context';
import { trpc } from '@/lib/trpc';

export default function OwnerDashboard() {
  const { profile, orgRole } = useAuth();
  const { data: dashboardData } = trpc.dashboard.summary.useQuery();

  const summaryData = dashboardData || {
    active_entities_count: 0,
    active_entities_delta_7d: 0,
    alerts_open_count: 0,
    workflow_runs_today_count: 0,
    workflow_failures_today_count: 0,
    tasks_open_count: 0,
    team_online_count: 0,
    system_health: 'ok' as const,
  };

  return (
    <View style={styles.container}>
      <SafeAreaView style={styles.safeArea} edges={['top']}>
        <ScrollView style={styles.scrollView}>
          <View style={styles.header}>
            <Text style={styles.title}>Command Center</Text>
            <Text style={styles.subtitle}>Welcome back, {profile?.full_name}</Text>
            <View style={styles.badge}>
              <Text style={styles.badgeText}>{orgRole?.toUpperCase()}</Text>
            </View>
          </View>

          <View style={styles.statsGrid}>
            <View style={styles.statCard}>
              <Text style={styles.statValue}>{summaryData.active_entities_count}</Text>
              <Text style={styles.statLabel}>Active Entities</Text>
            </View>
            <View style={styles.statCard}>
              <Text style={styles.statValue}>{summaryData.alerts_open_count}</Text>
              <Text style={styles.statLabel}>Open Alerts</Text>
            </View>
            <View style={styles.statCard}>
              <Text style={styles.statValue}>{summaryData.workflow_runs_today_count}</Text>
              <Text style={styles.statLabel}>Workflows Today</Text>
            </View>
            <View style={styles.statCard}>
              <Text style={styles.statValue}>{summaryData.tasks_open_count}</Text>
              <Text style={styles.statLabel}>Open Tasks</Text>
            </View>
            <View style={styles.statCard}>
              <Text style={styles.statValue}>{summaryData.team_online_count}</Text>
              <Text style={styles.statLabel}>Team Online</Text>
            </View>
            <View style={[styles.statCard, styles.healthCard]}>
              <Text style={styles.healthValue}>{summaryData.system_health.toUpperCase()}</Text>
              <Text style={styles.statLabel}>System Health</Text>
            </View>
          </View>
        </ScrollView>
      </SafeAreaView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#121212',
  },
  safeArea: {
    flex: 1,
  },
  scrollView: {
    flex: 1,
  },
  header: {
    padding: 24,
    borderBottomWidth: 1,
    borderBottomColor: '#222',
  },
  title: {
    fontSize: 32,
    fontWeight: '800',
    color: '#FFD700',
    marginBottom: 8,
  },
  subtitle: {
    fontSize: 16,
    color: '#999',
    marginBottom: 12,
  },
  badge: {
    alignSelf: 'flex-start',
    backgroundColor: 'rgba(255, 215, 0, 0.15)',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: 'rgba(255, 215, 0, 0.3)',
  },
  badgeText: {
    fontSize: 12,
    fontWeight: '700',
    color: '#FFD700',
  },
  statsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    padding: 16,
    gap: 12,
  },
  statCard: {
    width: '47%',
    backgroundColor: '#1a1a1a',
    borderRadius: 12,
    padding: 16,
    borderWidth: 1,
    borderColor: '#333',
  },
  statValue: {
    fontSize: 28,
    fontWeight: '700' as const,
    color: '#fff',
    marginBottom: 4,
  },
  statLabel: {
    fontSize: 13,
    color: '#888',
  },
  healthCard: {
    backgroundColor: 'rgba(34, 197, 94, 0.1)',
    borderColor: 'rgba(34, 197, 94, 0.3)',
  },
  healthValue: {
    fontSize: 28,
    fontWeight: '700' as const,
    color: '#22c55e',
    marginBottom: 4,
  },
});
